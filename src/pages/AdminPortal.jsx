import React from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../services/adminApi';
import { getApiBaseUrl } from '../utils/apiBaseUrl';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeSettingsPanel from '../components/ThemeSettingsPanel';
import { PremiumSurface, StatCard, StatusChip } from '../components/ui/PremiumPrimitives';
import '../styles/adminPortal.css';

const SECTION_CONFIG = [
  { id: 'overview', label: 'Overview', icon: '📊', group: 'Operations' },
  { id: 'registration_approvals', label: 'Registration Approvals', icon: '🆕', group: 'Approvals' },
  { id: 'approvals', label: 'Profile Approvals', icon: '✅', group: 'Approvals' },
  { id: 'users', label: 'User Directory', icon: '👥', group: 'User Ops' },
  { id: 'matches', label: 'Matches', icon: '💕', group: 'User Ops' },
  { id: 'chat_monitoring', label: 'Conversation Safety', icon: '🛡️', group: 'Moderation' },
  { id: 'reports', label: 'Reports Queue', icon: '🚩', group: 'Moderation' },
  { id: 'moderation', label: 'Content Moderation', icon: '🔍', group: 'Moderation' },
  { id: 'payments', label: 'Payment Reviews', icon: '💳', group: 'Finance' },
  { id: 'support', label: 'Support Desk', icon: '🎧', group: 'Support' },
  { id: 'analytics', label: 'Analytics', icon: '📈', group: 'Insights' },
  { id: 'activity', label: 'Audit Logs', icon: '📋', group: 'Insights' },
  { id: 'colleges', label: 'Colleges', icon: '🏫', group: 'Settings' },
  { id: 'settings', label: 'Platform Settings', icon: '⚙️', group: 'Settings' }
];

const NAV_GROUP_ORDER = ['Operations', 'Approvals', 'User Ops', 'Moderation', 'Finance', 'Support', 'Insights', 'Settings'];

const SECTION_ROLE_ACCESS = {
  overview: ['admin', 'super_admin', 'moderator', 'finance_admin'],
  registration_approvals: ['admin', 'super_admin', 'moderator'],
  users: ['admin', 'super_admin', 'moderator'],
  approvals: ['admin', 'super_admin', 'moderator'],
  matches: ['admin', 'super_admin', 'moderator'],
  chat_monitoring: ['admin', 'super_admin', 'moderator'],
  payments: ['admin', 'super_admin', 'finance_admin'],
  reports: ['admin', 'super_admin', 'moderator'],
  moderation: ['admin', 'super_admin', 'moderator'],
  colleges: ['admin', 'super_admin'],
  support: ['admin', 'super_admin', 'moderator'],
  analytics: ['admin', 'super_admin', 'finance_admin', 'moderator'],
  settings: ['admin', 'super_admin'],
  activity: ['admin', 'super_admin', 'moderator', 'finance_admin']
};

export default function AdminPortal() {
  const API_TIMEOUT_MS = 15000;
  const AUTO_REFRESH_INTERVAL_MS = 45000;
  const HEAVY_SECTION_MOUNT_DELAY_MS = 120;
  const NON_REFRESHABLE_SECTIONS = React.useMemo(() => new Set(['registration_approvals']), []);
  const HEAVY_RENDER_SECTIONS = React.useMemo(
    () => new Set(['chat_monitoring', 'payments', 'reports', 'support', 'analytics', 'activity']),
    []
  );
  const ADMIN_FULL_CHAT_VIEW_REQUESTED = String(import.meta.env.VITE_ENABLE_ADMIN_FULL_CHAT_VIEW || '').toLowerCase() === 'true';

  const API_BASE_URL = getApiBaseUrl();
  const API_ROOT = String(API_BASE_URL || '').replace(/\/api$/i, '');
  const navigate = useNavigate();
  const { user, clearAuth } = useAuth();
  const { activeTheme } = useTheme();
  const [section, setSection] = React.useState('overview');
  const [renderSection, setRenderSection] = React.useState('overview');
  const [themePanelOpen, setThemePanelOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [adminPin, setAdminPin] = React.useState('');
  const [pinEnabled, setPinEnabled] = React.useState(false);
  const [pinVerified, setPinVerified] = React.useState(false);
  const [pinAttempt, setPinAttempt] = React.useState('');

  const [overview, setOverview] = React.useState(null);
  const [users, setUsers] = React.useState([]);
  const [registrationApprovals, setRegistrationApprovals] = React.useState([]);
  const [approvals, setApprovals] = React.useState([]);
  const [matches, setMatches] = React.useState([]);
  const [chats, setChats] = React.useState([]);
  const [chatVisibilityMode, setChatVisibilityMode] = React.useState('metadata');
  const [payments, setPayments] = React.useState([]);
  const [paymentSummary, setPaymentSummary] = React.useState(null);
  const [reports, setReports] = React.useState([]);
  const [moderationPhotos, setModerationPhotos] = React.useState([]);
  const [colleges, setColleges] = React.useState([]);
  const [supportTickets, setSupportTickets] = React.useState([]);
  const [analytics, setAnalytics] = React.useState(null);
  const [settings, setSettings] = React.useState([]);
  const [activity, setActivity] = React.useState([]);
  const [detailTitle, setDetailTitle] = React.useState('');
  const [detailData, setDetailData] = React.useState(null);
  const [deleteDialog, setDeleteDialog] = React.useState({ open: false, userId: null, userName: null });
  const [deleteReason, setDeleteReason] = React.useState('');
  const [userFilters] = React.useState({ search: '', status: '', subscription: '' });
  const [paymentFilters] = React.useState({ status: '', plan: '', from: '', to: '' });
  const [manualRefreshEnabled, setManualRefreshEnabled] = React.useState(true);
  const [globalSearch, setGlobalSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [moderationFilter, setModerationFilter] = React.useState('all');
  const [dateRange, setDateRange] = React.useState('7d');
  const [customDateRange, setCustomDateRange] = React.useState({ from: '', to: '' });
  const isRefreshInFlightRef = React.useRef(false);
  const autoRefresh = React.useMemo(
    () => manualRefreshEnabled && !NON_REFRESHABLE_SECTIONS.has(section),
    [manualRefreshEnabled, NON_REFRESHABLE_SECTIONS, section]
  );
  const currentThemeName = React.useMemo(() => {
    if (activeTheme === 'classic-light') return 'Classic Light';
    if (activeTheme === 'admin-pro-dark' || activeTheme === 'admin-pro') return 'Admin Pro Dark';
    if (activeTheme === 'midnight-neon') return 'Midnight Neon';
    if (activeTheme === 'graphite-blue') return 'Graphite Blue';
    if (activeTheme === 'luxury-black' || activeTheme === 'vip-luxury') return 'Luxury Black';
    if (activeTheme === 'soft-dark-glass') return 'Soft Dark Glass';
    if (activeTheme === 'midnight-glass') return 'Midnight Glass';
    return activeTheme;
  }, [activeTheme]);

  const isAdminLightMode = React.useMemo(
    () => ['classic-light', 'light', 'soft-rose', 'cream'].some((name) => String(activeTheme || '').toLowerCase().includes(name)),
    [activeTheme]
  );

  const [toasts, setToasts] = React.useState([]);

  const notify = React.useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3600);
  }, []);

  const userRole = user?.role || 'user';
  const canAdminReadAllChats = React.useMemo(
    () => userRole === 'admin' || userRole === 'super_admin',
    [userRole]
  );
  const shouldPreferFullChatView = ADMIN_FULL_CHAT_VIEW_REQUESTED || canAdminReadAllChats;
  const visibleSections = React.useMemo(
    () => SECTION_CONFIG.filter((sectionItem) => (SECTION_ROLE_ACCESS[sectionItem.id] || []).includes(userRole)),
    [userRole]
  );

  const groupedSections = React.useMemo(() => {
    const grouped = {};
    for (const item of visibleSections) {
      if (!grouped[item.group]) {
        grouped[item.group] = [];
      }
      grouped[item.group].push(item);
    }
    return grouped;
  }, [visibleSections]);

  const normalizedSearch = globalSearch.trim().toLowerCase();

  const includesSearch = React.useCallback((candidate) => {
    if (!normalizedSearch) {
      return true;
    }
    return JSON.stringify(candidate || {}).toLowerCase().includes(normalizedSearch);
  }, [normalizedSearch]);

  const normalizeCollection = React.useCallback((payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.users)) return payload.users;
    if (Array.isArray(payload?.approvals)) return payload.approvals;
    if (Array.isArray(payload?.matches)) return payload.matches;
    if (Array.isArray(payload?.conversations)) return payload.conversations;
    if (Array.isArray(payload?.reports)) return payload.reports;
    if (Array.isArray(payload?.queue)) return payload.queue;
    if (Array.isArray(payload?.tickets)) return payload.tickets;
    if (Array.isArray(payload?.colleges)) return payload.colleges;
    if (Array.isArray(payload?.activity)) return payload.activity;
    return [];
  }, []);

  const toEpoch = React.useCallback((value) => {
    if (!value) {
      return 0;
    }
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
  }, []);

  const isWithinRange = React.useCallback((value) => {
    if (dateRange === 'all') {
      return true;
    }
    const ts = toEpoch(value);
    if (!ts) {
      return false;
    }
    const nowDate = new Date();
    const now = nowDate.getTime();
    const day = 24 * 60 * 60 * 1000;
    if (dateRange === '24h' || dateRange === 'today') return now - ts <= day;
    if (dateRange === '7d') return now - ts <= 7 * day;
    if (dateRange === '30d') return now - ts <= 30 * day;
    if (dateRange === '90d') return now - ts <= 90 * day;
    if (dateRange === 'this_month') {
      const monthStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1).getTime();
      return ts >= monthStart && ts <= now;
    }
    if (dateRange === 'custom') {
      const fromTs = customDateRange.from ? new Date(`${customDateRange.from}T00:00:00`).getTime() : 0;
      const toTs = customDateRange.to ? new Date(`${customDateRange.to}T23:59:59`).getTime() : 0;
      if (!fromTs || !toTs) {
        return true;
      }
      return ts >= fromTs && ts <= toTs;
    }
    return true;
  }, [dateRange, toEpoch, customDateRange]);

  const filteredUsers = React.useMemo(
    () => users.filter((item) => includesSearch(item) && (!statusFilter || item.status === statusFilter) && isWithinRange(item.updatedAt || item.createdAt || item.created_at)),
    [users, includesSearch, statusFilter, isWithinRange]
  );

  const filteredApprovals = React.useMemo(
    () => approvals.filter((item) => includesSearch(item) && (!statusFilter || item.profile_approval_status === statusFilter) && isWithinRange(item.updated_at || item.created_at)),
    [approvals, includesSearch, statusFilter, isWithinRange]
  );

  const filteredRegistrationApprovals = React.useMemo(
    () => registrationApprovals.filter((item) => includesSearch(item) && isWithinRange(item.updatedAt || item.createdAt || item.created_at)),
    [registrationApprovals, includesSearch, isWithinRange]
  );

  const filteredMatches = React.useMemo(
    () => matches.filter((item) => includesSearch(item) && isWithinRange(item.updatedAt || item.matchedAt)),
    [matches, includesSearch, isWithinRange]
  );

  const filteredChats = React.useMemo(
    () => chats.filter((item) => includesSearch(item) && isWithinRange(item.lastMessageAt || item.updatedAt || item.createdAt)),
    [chats, includesSearch, isWithinRange]
  );

  const filteredPayments = React.useMemo(
    () => payments.filter((item) => includesSearch(item) && (!statusFilter || item.status === statusFilter) && isWithinRange(item.updatedAt || item.createdAt || item.created_at)),
    [payments, includesSearch, statusFilter, isWithinRange]
  );

  const filteredReports = React.useMemo(
    () => reports.filter((item) => includesSearch(item) && (!statusFilter || item.status === statusFilter) && isWithinRange(item.updatedAt || item.createdAt || item.created_at)),
    [reports, includesSearch, statusFilter, isWithinRange]
  );

  const filteredSupportTickets = React.useMemo(
    () => supportTickets.filter((item) => includesSearch(item) && (!statusFilter || item.status === statusFilter) && isWithinRange(item.updatedAt || item.createdAt || item.created_at)),
    [supportTickets, includesSearch, statusFilter, isWithinRange]
  );

  const filteredActivity = React.useMemo(
    () => activity.filter((item) => includesSearch(item) && isWithinRange(item.timestamp || item.updatedAt || item.createdAt)),
    [activity, includesSearch, isWithinRange]
  );

  const handleLogout = () => {
    clearAuth();
    navigate('/', { replace: true });
  };

  // Development fallback mock data (uses real API in production)
  // Empty fallback data - no mock testing data
  const EMPTY_DATA = React.useMemo(() => ({
    overview: null,
    users: [],
    approvals: [],
    matches: [],
    chats: [],
    payments: [],
    paymentSummary: null,
    reports: [],
    colleges: [],
    support: [],
    analytics: null,
    settings: [],
    activity: []
  }), []);

  const loadData = React.useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError('');

    try {
      if (section === 'overview') {
        try {
          const response = await Promise.race([
            adminApi.getOverviewStats(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), API_TIMEOUT_MS))
          ]);
          if (response?.data) {
            setOverview(response.data);
          }
        } catch {
          console.log('🔄 Fetching real data from backend...');
          setOverview(EMPTY_DATA.overview);
        }
      }
      if (section === 'users') {
        try {
          const response = await Promise.race([
            adminApi.getUsers(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), API_TIMEOUT_MS))
          ]);
          const userData = normalizeCollection(response?.data);
          console.log('👥 Users fetched:', userData.length, 'items');
          if (Array.isArray(userData)) {
            setUsers(userData);
          }
        } catch {
          console.log('🔄 Loading users from backend...');
          setUsers(EMPTY_DATA.users);
        }
      }
      if (section === 'registration_approvals') {
        try {
          const response = await adminApi.getRegistrationApprovals();
          const users = normalizeCollection(response?.data);
          setRegistrationApprovals(Array.isArray(users) ? users : []);
        } catch (e) {
          console.error('❌ Failed to load pending registrations:', e.message, e);
          setError(e?.message || 'Failed to load pending registrations');
          setRegistrationApprovals([]);
        }
      }
      if (section === 'approvals') {
        try {
          const response = await Promise.race([
            adminApi.getProfileApprovals(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), API_TIMEOUT_MS))
          ]);
          setApprovals(normalizeCollection(response?.data));
        } catch {
          setApprovals(EMPTY_DATA.approvals);
        }
      }
      if (section === 'matches') {
        try {
          const response = await Promise.race([
            adminApi.getMatches(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), API_TIMEOUT_MS))
          ]);
          setMatches(normalizeCollection(response?.data));
        } catch {
          setMatches(EMPTY_DATA.matches);
        }
      }
      if (section === 'chat_monitoring') {
        try {
          let response;
          if (shouldPreferFullChatView) {
            try {
              response = await Promise.race([
                adminApi.getFullViewChats(50, 150),
                new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), API_TIMEOUT_MS))
              ]);
              setChatVisibilityMode('full');
            } catch (fullViewError) {
              console.warn('Full chat mode unavailable, falling back to metadata mode:', fullViewError?.message || fullViewError);
              response = await Promise.race([
                adminApi.getReadOnlyChats(50),
                new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), API_TIMEOUT_MS))
              ]);
              setChatVisibilityMode('metadata');
            }
          } else {
            response = await Promise.race([
              adminApi.getReadOnlyChats(50),
              new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), API_TIMEOUT_MS))
            ]);
            setChatVisibilityMode('metadata');
          }

          const modeFromApi = response?.data?.mode;
          if (modeFromApi === 'full' || modeFromApi === 'metadata') {
            setChatVisibilityMode(modeFromApi);
          }

          const chatData = response?.data?.conversations || [];
          setChats(Array.isArray(chatData) ? chatData : []);
        } catch {
          setChatVisibilityMode('metadata');
          setChats(EMPTY_DATA.chats);
        }
      }
      if (section === 'payments') {
        try {
          const [response, summaryResponse, settingsResponse] = await Promise.all([
            Promise.race([
              adminApi.getPayments(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), API_TIMEOUT_MS))
            ]),
            Promise.race([
              adminApi.getPaymentSummary(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), API_TIMEOUT_MS))
            ]),
            Promise.race([
              adminApi.getSettings(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), API_TIMEOUT_MS))
            ])
          ]);
          const paymentData = normalizeCollection(response?.data);
          const summaryData = summaryResponse?.data || {};
          const settingsData = normalizeCollection(settingsResponse?.data);
          console.log('💳 Payments fetched:', paymentData.length, 'items');
          setPayments(Array.isArray(paymentData) ? paymentData : []);
          setSettings(Array.isArray(settingsData) ? settingsData : []);

          const fallbackSummary = {
            totalRevenue: paymentData.reduce((sum, p) => sum + (['approved', 'active'].includes(String(p.status || '').toLowerCase()) ? Number(p.amount || 0) : 0), 0),
            totalPayments: paymentData.length,
            approvedPayments: paymentData.filter((p) => ['approved', 'active'].includes(String(p.status || '').toLowerCase())).length || 0,
            failedPayments: paymentData.filter((p) => ['rejected', 'failed'].includes(String(p.status || '').toLowerCase())).length || 0
          };
          setPaymentSummary({
            totalRevenue: Number(summaryData.totalRevenue ?? fallbackSummary.totalRevenue),
            totalPayments: Number(summaryData.totalPayments ?? fallbackSummary.totalPayments),
            approvedPayments: Number(summaryData.approvedPayments ?? fallbackSummary.approvedPayments),
            failedPayments: Number(summaryData.failedPayments ?? fallbackSummary.failedPayments)
          });
        } catch (e) {
          console.error('❌ Error fetching payments:', e.message);
          setPayments(EMPTY_DATA.payments);
          setPaymentSummary(EMPTY_DATA.paymentSummary);
        }
      }
      if (section === 'reports') {
        try {
          const response = await Promise.race([
            adminApi.getReports(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), API_TIMEOUT_MS))
          ]);
          setReports(normalizeCollection(response?.data));
        } catch {
          setReports(EMPTY_DATA.reports);
        }
      }
      if (section === 'moderation') {
        try {
          const response = await Promise.race([
            adminApi.getModerationPhotos(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), API_TIMEOUT_MS))
          ]);
          setModerationPhotos(normalizeCollection(response?.data));
        } catch {
          setModerationPhotos([]);
        }
      }
      if (section === 'colleges') {
        try {
          const response = await Promise.race([
            adminApi.getColleges(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), API_TIMEOUT_MS))
          ]);
          setColleges(normalizeCollection(response?.data));
        } catch {
          setColleges(EMPTY_DATA.colleges);
        }
      }
      if (section === 'support') {
        try {
          const [response, settingsResponse] = await Promise.all([
            Promise.race([
              adminApi.getSupportTickets(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), API_TIMEOUT_MS))
            ]),
            Promise.race([
              adminApi.getSettings(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), API_TIMEOUT_MS))
            ])
          ]);
          setSupportTickets(normalizeCollection(response?.data));
          setSettings(normalizeCollection(settingsResponse?.data));
        } catch {
          setSupportTickets(EMPTY_DATA.support);
        }
      }
      if (section === 'analytics') {
        try {
          const response = await Promise.race([
            adminApi.getAnalytics(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), API_TIMEOUT_MS))
          ]);
          setAnalytics(response?.data);
        } catch {
          setAnalytics(EMPTY_DATA.analytics);
        }
      }
      if (section === 'settings') {
        try {
          const response = await Promise.race([
            adminApi.getSettings(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), API_TIMEOUT_MS))
          ]);
          setSettings(response?.data?.data || response?.data || []);
        } catch {
          setSettings(EMPTY_DATA.settings);
        }
      }
      if (section === 'activity') {
        try {
          const response = await Promise.race([
            adminApi.getActivityLogs(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), API_TIMEOUT_MS))
          ]);
          setActivity(normalizeCollection(response?.data));
        } catch {
          setActivity(EMPTY_DATA.activity);
        }
      }
    } catch (err) {
      console.error(`Admin panel error loading ${section}:`, err);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [section, API_TIMEOUT_MS, shouldPreferFullChatView, normalizeCollection, EMPTY_DATA]);

  // Auto-refresh in the background at a safe cadence.
  React.useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const interval = setInterval(() => {
      if (document.hidden || isRefreshInFlightRef.current) {
        return;
      }

      isRefreshInFlightRef.current = true;
      void loadData({ silent: true }).finally(() => {
        isRefreshInFlightRef.current = false;
      });
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [autoRefresh, loadData, AUTO_REFRESH_INTERVAL_MS]);

  React.useEffect(() => {
    console.log(`📂 Section changed to: ${section}`);
    void loadData({ silent: false });
  }, [loadData, section]);

  React.useEffect(() => {
    if (!HEAVY_RENDER_SECTIONS.has(section)) {
      setRenderSection(section);
      return undefined;
    }

    setRenderSection('');
    const timer = window.setTimeout(() => {
      setRenderSection(section);
    }, HEAVY_SECTION_MOUNT_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [section, HEAVY_RENDER_SECTIONS, HEAVY_SECTION_MOUNT_DELAY_MS]);

  const verifyPin = async () => {
    try {
      const response = await adminApi.verifyPin(pinAttempt);
      if (response?.data?.enabled) {
        setPinEnabled(true);
      }
      setPinVerified(Boolean(response?.data?.verified));
      setAdminPin(pinAttempt);
      setPinAttempt('');
    } catch {
      setPinEnabled(true);
      setPinVerified(false);
      setError('Admin PIN verification failed');
    }
  };

  const requiresPinAction = async (action) => {
    if (pinEnabled && !pinVerified) {
      setError('Verify admin PIN before sensitive actions');
      return;
    }

    await action();
    await loadData();
  };

  const handleModerationAction = async (userId, action) => {
    const requiresReason = ['ban', 'suspend', 'delete', 'freeze_chat'].includes(action);
    let reason = '';

    if (requiresReason) {
      reason = window.prompt(`Enter reason for ${action.replace('_', ' ')} action:`, '') || '';
      if (reason.trim().length < 5) {
        notify('Reason must be at least 5 characters for this action.', 'error');
        return;
      }
    }

    await requiresPinAction(async () => {
      await adminApi.updateUserModeration(userId, { action, reason }, adminPin);
    });
  };

  const handleDeleteUser = async (userId, userName) => {
    setDeleteDialog({ open: true, userId, userName });
  };

  const confirmDeleteUser = async () => {
    if (!deleteDialog.userId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_ROOT}/api/admin/users/${deleteDialog.userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('authToken')}`,
          'x-admin-pin': adminPin || ''
        },
        body: JSON.stringify({ reason: deleteReason })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.message || 'Failed to delete user');
      }

      await response.json();
      
      // Remove from users list
      setUsers(prev => prev.filter(u => u._id !== deleteDialog.userId));
      
      notify(`User ${deleteDialog.userName} deleted. Related records were purged and re-registration remains allowed.`);
      
      setDeleteDialog({ open: false, userId: null, userName: null });
      setDeleteReason('');
      setLoading(false);
    } catch (err) {
      console.error('Delete error:', err);
      notify(`Delete failed: ${err.message}`, 'error');
      setLoading(false);
    }
  };

  const handleApprovalAction = async (userId, status) => {
    await requiresPinAction(async () => {
      await adminApi.updateProfileApproval(userId, { status }, adminPin);
    });
  };

  const handleViewUserActivity = async (userId) => {
    try {
      const response = await adminApi.getUserActivity(userId);
      const payload = response?.data || {};
      openDetailDrawer('User Activity', payload);
    } catch (err) {
      setError(err?.message || 'Failed to load user activity');
    }
  };

  const handleRegistrationApproval = async (userId, action, options = {}) => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
    if (!token) {
      console.error('❌ No auth token found');
      notify('Admin session missing. Please sign in again.', 'error');
      return;
    }

    console.log('🔐 Starting approval action:', action, 'for user:', userId);
    
    const endpoint = action === 'approve' 
      ? `${API_ROOT}/api/admin/registrations/${userId}/approve`
      : `${API_ROOT}/api/admin/registrations/${userId}/reject`;

    let reason = String(options?.reason || '').trim();
    if (action === 'reject' && !reason) {
      reason = window.prompt('Enter rejection reason:', 'Profile does not meet requirements') || '';
      if (!reason.trim()) {
        console.log('ℹ️ Rejection cancelled by admin');
        return false;
      }
    }

    try {
      console.log('📤 Sending request to:', endpoint);
      console.log('🔐 Auth header:', `Bearer ${token.substring(0, 30)}...`);
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-admin-pin': adminPin || ''
        },
        body: JSON.stringify({ reason })
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response OK:', response.ok);
      console.log('📡 Response headers:', response.headers);

      // Try to parse response
      let data;
      try {
        const text = await response.text();
        console.log('📥 Response text:', text);
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        console.error('❌ Failed to parse JSON:', parseErr);
        data = { message: 'Server error - invalid response' };
      }

      console.log('📥 Parsed data:', data);

      if (!response.ok) {
        const errorMsg = data.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error('❌ API error:', response.status, errorMsg);
        notify(`Failed to ${action} user: ${errorMsg}`, 'error');
        return false;
      }

      console.log(`✅ User ${action}ed successfully!`);
      
      // Remove from pending list immediately
      const removeRow = () => {
        setRegistrationApprovals((prev) => {
          const updated = prev.filter((u) => u._id !== userId);
          console.log(`📊 Updated pending approvals count: ${updated.length}`);
          return updated;
        });
      };

      const deferMs = Number(options?.deferRemovalMs || 0);
      if (deferMs > 0) {
        window.setTimeout(removeRow, deferMs);
      } else {
        removeRow();
      }
      
      notify(`User ${action}ed successfully.`);
      return true;
      
    } catch (err) {
      console.error('❌ Error during approval:', err);
      console.error('❌ Error type:', err.constructor.name);
      console.error('❌ Error message:', err.message);
      console.error('❌ Full error:', err);
      notify(`Network error while processing approval: ${err.message}`, 'error');
      return false;
    }
  };

  const handleResolveReport = async (reportId) => {
    await requiresPinAction(async () => {
      await adminApi.resolveReport(reportId, { status: 'resolved', moderationNotes: 'Resolved by admin portal' }, adminPin);
    });
  };

  const handleUpdateSetting = async (key, value) => {
    try {
      await requiresPinAction(async () => {
        await adminApi.updateSetting({ key, value, description: 'Updated from admin portal' }, adminPin);
      });
      notify(`Setting ${key} updated successfully.`);
    } catch (err) {
      notify(err?.message || `Failed to update setting ${key}`, 'error');
    }
  };

  const openDetailDrawer = (title, data) => {
    setDetailTitle(title);
    setDetailData(data);
  };

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  };

  const toCsv = (records = []) => {
    if (!records.length) return '';
    const headers = Object.keys(records[0]);
    const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows = records.map((record) => headers.map((header) => escape(record[header])).join(','));
    return [headers.join(','), ...rows].join('\n');
  };

  const exportCurrentSection = async () => {
    try {
      if (section === 'users') {
        const blob = await adminApi.exportUsersExcel({ status: userFilters.status || undefined });
        downloadBlob(blob, `users-${Date.now()}.xlsx`);
        return;
      }

      if (section === 'payments') {
        const blob = await adminApi.exportSubscriptionsExcel({ status: paymentFilters.status || undefined, plan: paymentFilters.plan || undefined });
        downloadBlob(blob, `subscriptions-${Date.now()}.xlsx`);
        return;
      }

      const map = {
        reports,
        chats,
        support: supportTickets,
        approvals,
        colleges,
        activity
      };

      const source = map[section] || [];
      const csv = toCsv(source.map((item) => ({ ...item })));
      downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${section}-${Date.now()}.csv`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to export data');
    }
  };

  return (
    <section className={`admin-portal relative min-h-screen overflow-hidden ${isAdminLightMode ? 'admin-portal--light' : 'admin-portal--dark'}`} style={{ background: 'var(--bg-primary)', color: 'var(--text-light)' }}>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:42px_42px] opacity-[0.08]" />
      <div className="relative z-10 flex h-screen w-full min-w-0">
        {/* SIDEBAR */}
        <aside className="admin-surface w-[292px] border-r backdrop-blur-2xl flex flex-col overflow-hidden shadow-[28px_0_80px_rgba(2,12,27,0.55)]">
          <div className="p-5 border-b border-cyan-300/15 bg-gradient-to-r from-cyan-500/20 via-sky-500/15 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center text-white text-xl shadow-[0_14px_35px_rgba(14,165,233,0.4)]">
                👫
              </div>
              <div>
                <h1 className="text-base font-bold tracking-wide text-white">CU-Daters Ops</h1>
                <p className="text-[11px] text-cyan-100/85 uppercase tracking-[0.18em]">Admin System</p>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 border-b border-cyan-200/10 bg-white/5">
            <p className="text-[11px] text-cyan-200/70 uppercase tracking-[0.18em]">Signed In</p>
            <p className="text-sm font-semibold text-white mt-1">{user?.name || 'Admin'}</p>
            <p className="text-xs text-slate-300 truncate">{user?.email || 'admin@cudaters.in'}</p>
            <p className="mt-2 inline-flex px-2 py-1 text-[10px] rounded-full border border-cyan-200/45 bg-cyan-400/15 text-cyan-100 uppercase tracking-wider">
              Role: {userRole}
            </p>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
            {NAV_GROUP_ORDER.map((groupName) => (
              groupedSections[groupName]?.length ? (
                <div key={groupName}>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-200/45 px-3 mb-2 font-semibold">{groupName}</p>
                  <div className="space-y-1">
                    {groupedSections[groupName].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSection(item.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2.5 ${
                          section === item.id
                            ? 'bg-gradient-to-r from-cyan-500/90 to-sky-500/90 text-white shadow-lg shadow-cyan-900/45'
                            : 'text-slate-200/85 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <span className="text-base">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null
            ))}
          </nav>

          <div className="p-4 border-t border-cyan-200/10 bg-white/5 space-y-2.5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-100/65">Admin PIN</p>
            <div className="flex gap-2">
              <input
                type="password"
                value={pinAttempt}
                onChange={(event) => setPinAttempt(event.target.value)}
                placeholder="••••••"
                className="flex-1 px-3 py-2 rounded-xl border border-cyan-200/20 bg-[#0c1a32]/80 text-white text-sm placeholder-slate-500 focus:border-cyan-300 focus:outline-none"
              />
              <button onClick={verifyPin} className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-white font-semibold transition shadow-lg shadow-cyan-900/40">
                Verify
              </button>
            </div>
            <p className={`text-xs ${pinVerified ? 'text-emerald-300' : 'text-slate-300/70'}`}>
              {pinVerified ? 'PIN verified for sensitive actions' : 'Optional unless privileged action is required'}
            </p>
            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-sm font-semibold transition-all"
            >
              Logout Admin
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* TOP BAR */}
          <div className="admin-surface border-b px-6 xl:px-8 py-4 backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-100/65">CU-Daters / Admin / {visibleSections.find((s) => s.id === section)?.label || 'Overview'}</p>
                <h2 className="text-2xl font-bold text-white mt-1">{visibleSections.find((s) => s.id === section)?.label || 'Overview'}</h2>
                <p className="text-sm text-slate-200/85 mt-1">Operational controls, moderation safety workflows, and platform governance.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusChip tone="info">Live</StatusChip>
                <button
                  type="button"
                  className="w-10 h-10 rounded-xl border border-cyan-100/20 bg-white/10 hover:bg-white/15 transition"
                  title="Notifications"
                >
                  🔔
                </button>
                <button
                  onClick={() => setThemePanelOpen(true)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold transition border border-cyan-100/20"
                >
                  Theme: {currentThemeName}
                </button>
                <button onClick={() => loadData()} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold transition border border-cyan-100/20">
                  Refresh
                </button>
                <button onClick={() => exportCurrentSection()} className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold hover:opacity-95 transition shadow-lg shadow-cyan-900/40">
                  Export
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl border border-cyan-100/20 bg-white/10 hover:bg-white/15 text-sm font-medium"
                  title="Admin profile"
                >
                  {user?.name ? user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() : 'AD'}
                </button>
              </div>
            </div>
          </div>

          {/* CONTENT AREA */}
          <div className="admin-surface flex-1 overflow-auto px-6 xl:px-8 py-6">
            {/* Search + Filters */}
            <div className="mb-6 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-4 backdrop-blur-2xl shadow-[0_18px_48px_rgba(2,8,25,0.45)]">
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_160px_170px_220px] gap-3 items-center">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-cyan-200/20 bg-white/10">
                  <span className="text-cyan-100/80">🔍</span>
                  <input
                    type="text"
                    value={globalSearch}
                    onChange={(event) => setGlobalSearch(event.target.value)}
                    placeholder="Search users, reports, conversations, IDs..."
                    className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="px-3 py-2.5 bg-white/10 border border-cyan-200/20 text-slate-100 rounded-xl text-sm focus:outline-none focus:border-cyan-300"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="resolved">Resolved</option>
                  <option value="open">Open</option>
                </select>

                <select
                  value={moderationFilter}
                  onChange={(event) => setModerationFilter(event.target.value)}
                  className="px-3 py-2.5 bg-white/10 border border-cyan-200/20 text-slate-100 rounded-xl text-sm focus:outline-none focus:border-cyan-300"
                >
                  <option value="all">All Moderation</option>
                  <option value="high_risk">High Risk</option>
                  <option value="reported">Reported</option>
                  <option value="flagged">Flagged</option>
                  <option value="blocked">Blocked</option>
                  <option value="most_messages">Most Messages</option>
                  <option value="latest_activity">Latest Activity</option>
                  <option value="under_review">Under Review</option>
                  <option value="resolved">Resolved Cases</option>
                </select>

                <select
                  value={dateRange}
                  onChange={(event) => setDateRange(event.target.value)}
                  className="px-3 py-2.5 bg-white/10 border border-cyan-200/20 text-slate-100 rounded-xl text-sm focus:outline-none focus:border-cyan-300"
                >
                  <option value="today">Today</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="this_month">This month</option>
                  <option value="custom">Custom range</option>
                  <option value="all">All Time</option>
                </select>
              </div>

              {dateRange === 'custom' ? (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-cyan-200/20 bg-white/10">
                    <span className="text-xs uppercase tracking-wide text-cyan-100/80">From</span>
                    <input
                      type="date"
                      value={customDateRange.from}
                      max={customDateRange.to || undefined}
                      onChange={(event) => setCustomDateRange((prev) => ({ ...prev, from: event.target.value }))}
                      className="ml-auto bg-transparent text-sm text-slate-100 focus:outline-none"
                    />
                  </label>
                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-cyan-200/20 bg-white/10">
                    <span className="text-xs uppercase tracking-wide text-cyan-100/80">To</span>
                    <input
                      type="date"
                      value={customDateRange.to}
                      min={customDateRange.from || undefined}
                      onChange={(event) => setCustomDateRange((prev) => ({ ...prev, to: event.target.value }))}
                      className="ml-auto bg-transparent text-sm text-slate-100 focus:outline-none"
                    />
                  </label>
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-full border border-cyan-300/30 bg-cyan-500/10 text-cyan-200">{chatVisibilityMode === 'full' ? 'Test mode: full conversation visibility ON' : 'Privacy-first moderation enabled'}</span>
                <span className="px-2.5 py-1 rounded-full border border-amber-300/30 bg-amber-500/10 text-amber-200">{chatVisibilityMode === 'full' ? 'Feature flag: VITE_ENABLE_ADMIN_FULL_CHAT_VIEW + ENABLE_ADMIN_FULL_CHAT_VIEW' : 'Sensitive access requires reason + role'}</span>
                <span className="px-2.5 py-1 rounded-full border border-cyan-200/30 bg-cyan-400/10 text-cyan-100">Auto refresh: {autoRefresh ? 'ON' : 'OFF'}</span>
                <button
                  type="button"
                  onClick={() => setManualRefreshEnabled((prev) => !prev)}
                  className={`px-2.5 py-1 rounded-full border transition-colors ${manualRefreshEnabled ? 'border-emerald-300/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20' : 'border-slate-500/40 bg-slate-500/10 text-slate-300 hover:bg-slate-500/20'}`}
                >
                  {manualRefreshEnabled ? 'Turn Auto Refresh OFF' : 'Turn Auto Refresh ON'}
                </button>
                {!manualRefreshEnabled ? <span className="px-2.5 py-1 rounded-full border border-slate-400/30 bg-slate-500/10 text-slate-300">Manual mode</span> : null}
                {manualRefreshEnabled && NON_REFRESHABLE_SECTIONS.has(section) ? <span className="px-2.5 py-1 rounded-full border border-slate-400/30 bg-slate-500/10 text-slate-300">Section policy: auto refresh disabled</span> : null}
              </div>
            </div>

            {error && (
              <div className="mb-4 px-6 py-4 rounded-xl bg-red-900/20 text-red-300 border border-red-700 flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="inline-flex animate-spin mb-4">
                    <span className="text-5xl">⏳</span>
                  </div>
                  <p className="text-lg text-gray-400">Loading {section}...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Content Panels */}
                {!loading && renderSection === 'overview' ? (
                  <OverviewPanel
                    overview={overview}
                    users={users}
                    reports={reports}
                    chats={chats}
                    payments={payments}
                    approvals={registrationApprovals}
                    profileApprovals={approvals}
                    activityLogs={activity}
                    dateRange={dateRange}
                    customDateRange={customDateRange}
                    onSectionChange={setSection}
                  />
                ) : null}
                {!loading && renderSection === 'registration_approvals' ? (
                  <RegistrationApprovalsPanel
                    registrations={filteredRegistrationApprovals}
                    onApprove={handleRegistrationApproval}
                    onOpenDetail={openDetailDrawer}
                    onNotify={notify}
                    pinEnabled={pinEnabled}
                    pinVerified={pinVerified}
                    adminPin={adminPin}
                  />
                ) : null}
                {!loading && renderSection === 'users' ? <UsersPanel users={filteredUsers} onModerate={handleModerationAction} onDelete={handleDeleteUser} onOpenDetail={openDetailDrawer} onViewActivity={handleViewUserActivity} onNotify={notify} /> : null}
                {!loading && renderSection === 'approvals' ? <ApprovalsPanel approvals={filteredApprovals} onApprove={handleApprovalAction} onOpenDetail={openDetailDrawer} /> : null}
                {!loading && renderSection === 'matches' ? <MatchesPanel matches={filteredMatches} onOpenDetail={openDetailDrawer} /> : null}
                {!loading && renderSection === 'chat_monitoring' ? <ChatsPanel chats={filteredChats} moderationFilter={moderationFilter} currentRole={userRole} onOpenDetail={openDetailDrawer} visibilityMode={chatVisibilityMode} /> : null}
                {!loading && renderSection === 'payments' ? <PaymentsPanel payments={filteredPayments} summary={paymentSummary} onOpenDetail={openDetailDrawer} onRefresh={loadData} onUpdateSetting={handleUpdateSetting} settings={settings} adminPin={adminPin} onNotify={notify} /> : null}
                {!loading && renderSection === 'reports' ? <ReportsPanel reports={filteredReports} onResolve={handleResolveReport} onOpenDetail={openDetailDrawer} /> : null}
                {!loading && renderSection === 'moderation' ? <ModerationPanel photos={moderationPhotos} /> : null}
                {!loading && renderSection === 'colleges' ? <CollegesPanel colleges={colleges} /> : null}
                {!loading && renderSection === 'support' ? <SupportPanel tickets={filteredSupportTickets} settings={settings} onUpdateSetting={handleUpdateSetting} onNotify={notify} /> : null}
                {!loading && renderSection === 'analytics' ? <AnalyticsPanel analytics={analytics} /> : null}
                {!loading && renderSection === 'settings' ? <SettingsPanel settings={settings} onUpdate={handleUpdateSetting} /> : null}
                {!loading && renderSection === 'activity' ? <ActivityPanel logs={filteredActivity} /> : null}
              </>
            )}
          </div>
        </main>
      </div>

      <div className="admin-toast-stack">
        {toasts.map((toast) => (
          <div key={toast.id} className={`admin-toast ${toast.type === 'error' ? 'error' : 'success'}`}>
            {toast.message}
          </div>
        ))}
      </div>

      {/* Detail Drawer */}
      <DetailDrawer title={detailTitle} data={detailData} onClose={() => setDetailData(null)} />

      {/* Delete Confirmation Dialog */}
      {deleteDialog.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border-4 border-red-500">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🗑️</div>
              <h3 className="text-2xl font-black text-red-700">PERMANENT DELETE</h3>
              <p className="text-gray-600 mt-2">This action cannot be undone!</p>
            </div>

            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Delete User:</strong>
              </p>
              <p className="text-lg font-bold text-red-700">{deleteDialog.userName}</p>
              <p className="text-xs text-gray-600 mt-2">
                All data will be permanently deleted:
              </p>
              <ul className="text-xs text-gray-600 mt-2 space-y-1 list-disc list-inside">
                <li>Profile & account info</li>
                <li>All matches & connections</li>
                <li>Chat conversations & messages</li>
                <li>Likes & interactions</li>
                <li>Subscriptions & payments</li>
              </ul>
              <p className="text-xs text-green-600 mt-3 italic">
                ✅ They can re-register with same email/phone
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Reason for Deletion (optional)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Enter reason (for audit log)..."
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none text-sm"
                rows="3"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-6">
              <p className="text-xs text-yellow-800">
                <strong>⚠️ Warning:</strong> Confirm you have admin PIN ready
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteDialog({ open: false, userId: null, userName: null });
                  setDeleteReason('');
                }}
                className="flex-1 px-4 py-3 rounded-lg bg-gray-300 text-gray-800 font-bold hover:bg-gray-400 transition-all transform hover:scale-105"
              >
                ❌ CANCEL
              </button>
              <button
                onClick={confirmDeleteUser}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-lg bg-red-600 text-white font-black hover:bg-red-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '🔄 Deleting...' : '🗑️ CONFIRM DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ThemeSettingsPanel
        open={themePanelOpen}
        onClose={() => setThemePanelOpen(false)}
      />
    </section>
  );
}

function OverviewPanel({
  overview,
  users = [],
  reports = [],
  chats = [],
  payments = [],
  approvals = [],
  profileApprovals = [],
  activityLogs = [],
  dateRange = '7d',
  customDateRange = { from: '', to: '' },
  onSectionChange
}) {
  const [growthRange, setGrowthRange] = React.useState('30d');

  const toEpoch = React.useCallback((value) => {
    if (!value) return 0;
    const ts = new Date(value).getTime();
    return Number.isFinite(ts) ? ts : 0;
  }, []);

  const formatCompact = React.useCallback((value) => Number(value || 0).toLocaleString('en-IN'), []);
  const formatCurrency = React.useCallback((value) => `INR ${Number(value || 0).toLocaleString('en-IN')}`, []);

  const normalizeRange = React.useCallback((value) => {
    if (value === '24h') return 'today';
    if (value === 'all') return '12m';
    return value;
  }, []);

  React.useEffect(() => {
    const mapped = normalizeRange(dateRange);
    const next = ['7d', '30d', '90d', '12m'].includes(mapped) ? mapped : '30d';
    setGrowthRange(next);
  }, [dateRange, normalizeRange]);

  const getWindow = React.useCallback((rangeKey, custom = customDateRange) => {
    const now = new Date();
    const end = now.getTime();
    const day = 24 * 60 * 60 * 1000;

    if (rangeKey === 'today') return { start: end - day, end, label: 'today' };
    if (rangeKey === '7d') return { start: end - 7 * day, end, label: 'last 7 days' };
    if (rangeKey === '30d') return { start: end - 30 * day, end, label: 'last 30 days' };
    if (rangeKey === '90d') return { start: end - 90 * day, end, label: 'last 90 days' };
    if (rangeKey === '12m') return { start: new Date(now.getFullYear(), now.getMonth() - 11, 1).getTime(), end, label: 'last 12 months' };
    if (rangeKey === 'this_month') return { start: new Date(now.getFullYear(), now.getMonth(), 1).getTime(), end, label: 'this month' };
    if (rangeKey === 'custom') {
      const from = custom?.from ? new Date(`${custom.from}T00:00:00`).getTime() : end - 7 * day;
      const to = custom?.to ? new Date(`${custom.to}T23:59:59`).getTime() : end;
      return { start: Math.min(from, to), end: Math.max(from, to), label: 'custom range' };
    }
    return { start: end - 30 * day, end, label: 'last 30 days' };
  }, [customDateRange]);

  const buildBuckets = React.useCallback((rangeKey, custom = customDateRange) => {
    const window = getWindow(rangeKey, custom);
    const buckets = [];
    const day = 24 * 60 * 60 * 1000;

    if (rangeKey === '12m') {
      const now = new Date(window.end);
      for (let i = 11; i >= 0; i -= 1) {
        const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        buckets.push({
          start: startDate.getTime(),
          end: endDate.getTime(),
          label: startDate.toLocaleDateString('en-US', { month: 'short' })
        });
      }
      return { buckets, label: window.label };
    }

    if (rangeKey === 'today') {
      const endDate = new Date(window.end);
      for (let i = 23; i >= 0; i -= 1) {
        const startDate = new Date(endDate.getTime() - i * 60 * 60 * 1000);
        const bucketStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), startDate.getHours(), 0, 0, 0).getTime();
        const bucketEnd = bucketStart + 60 * 60 * 1000;
        buckets.push({
          start: bucketStart,
          end: bucketEnd,
          label: new Date(bucketStart).toLocaleTimeString('en-US', { hour: 'numeric' })
        });
      }
      return { buckets, label: window.label };
    }

    if (rangeKey === '90d') {
      for (let i = 12; i >= 0; i -= 1) {
        const bucketStart = window.end - (i + 1) * 7 * day;
        const bucketEnd = window.end - i * 7 * day;
        buckets.push({
          start: bucketStart,
          end: bucketEnd,
          label: `W${13 - i}`
        });
      }
      return { buckets, label: window.label };
    }

    const span = Math.max(1, Math.ceil((window.end - window.start) / day));
    const limit = Math.min(span, 31);
    for (let i = limit - 1; i >= 0; i -= 1) {
      const bucketStart = window.end - (i + 1) * day;
      const bucketEnd = window.end - i * day;
      buckets.push({
        start: bucketStart,
        end: bucketEnd,
        label: new Date(bucketStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    return { buckets, label: window.label };
  }, [customDateRange, getWindow]);

  const aggregateSeries = React.useCallback((items, buckets, pickTs, predicate = () => true, mapValue = () => 1) => {
    const values = Array.from({ length: buckets.length }, () => 0);
    for (const item of items || []) {
      if (!predicate(item)) continue;
      const ts = toEpoch(pickTs(item));
      if (!ts) continue;
      const bucketIndex = buckets.findIndex((bucket) => ts >= bucket.start && ts < bucket.end);
      if (bucketIndex >= 0) {
        values[bucketIndex] += Number(mapValue(item) || 0);
      }
    }
    return values;
  }, [toEpoch]);

  const countInWindow = React.useCallback((items, pickTs, window, predicate = () => true) => {
    let count = 0;
    for (const item of items || []) {
      if (!predicate(item)) continue;
      const ts = toEpoch(pickTs(item));
      if (ts >= window.start && ts < window.end) count += 1;
    }
    return count;
  }, [toEpoch]);

  const sumInWindow = React.useCallback((items, pickTs, window, predicate = () => true, mapValue = () => 0) => {
    let total = 0;
    for (const item of items || []) {
      if (!predicate(item)) continue;
      const ts = toEpoch(pickTs(item));
      if (ts >= window.start && ts < window.end) total += Number(mapValue(item) || 0);
    }
    return total;
  }, [toEpoch]);

  const pctDelta = React.useCallback((current, previous) => {
    if (previous <= 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  }, []);

  const deltaLabel = React.useCallback((current, previous) => {
    const delta = pctDelta(current, previous);
    const sign = delta >= 0 ? '+' : '';
    return `${sign}${delta.toFixed(1)}%`;
  }, [pctDelta]);

  const normalizedRange = normalizeRange(dateRange);
  const globalRange = ['today', '7d', '30d', '90d', 'this_month', 'custom', '12m'].includes(normalizedRange) ? normalizedRange : '30d';
  const globalWindow = getWindow(globalRange);
  const previousWindow = { start: globalWindow.start - (globalWindow.end - globalWindow.start), end: globalWindow.start };

  const userTimestamp = (user) => user?.createdAt || user?.created_at || user?.updatedAt;
  const userActivityTimestamp = (user) => user?.lastSeenAt || user?.last_active_at || user?.updatedAt || user?.createdAt;
  const registrationTimestamp = (item) => item?.createdAt || item?.created_at || item?.updatedAt;
  const profileTimestamp = (item) => item?.updated_at || item?.updatedAt || item?.created_at || item?.createdAt;
  const reportTimestamp = (report) => report?.createdAt || report?.created_at || report?.updatedAt;
  const chatTimestamp = (chat) => chat?.lastMessageAt || chat?.updatedAt || chat?.createdAt;
  const paymentTimestamp = (payment) => payment?.createdAt || payment?.created_at || payment?.updatedAt;
  const activityTimestamp = (entry) => entry?.timestamp || entry?.updatedAt || entry?.createdAt;
  const normalizeStatus = (value) => String(value || '').toLowerCase();

  const totalUsers = Number(overview?.totalUsers || users.length || 0);
  const activeToday = Number(overview?.activeToday || overview?.activeUsers || countInWindow(users, userActivityTimestamp, getWindow('today')) || 0);
  const newRegistrations = Number(overview?.newRegistrations || countInWindow(users, userTimestamp, globalWindow) || 0);
  const pendingRegistrationApprovals = Number(overview?.pendingRegistrationApprovals || approvals.filter((item) => normalizeStatus(item?.status || item?.registration_status || item?.profile_approval_status) === 'pending').length || 0);
  const pendingProfileApprovals = Number(overview?.pendingProfileApprovals || overview?.pendingApprovals || profileApprovals.filter((item) => normalizeStatus(item?.profile_approval_status || item?.status) === 'pending').length || 0);
  const activeReports = Number(overview?.activeReports || reports.filter((report) => normalizeStatus(report.status) !== 'resolved').length || 0);
  const flaggedChats = Number(overview?.flaggedChats || chats.filter((chat) => Number(chat.riskScore || 0) >= 65 || Number(chat.reportCount || 0) > 0).length || 0);
  const suspiciousUsers = Number(overview?.suspiciousUsers || users.filter((user) => Number(user.warnings_count || 0) > 1 || normalizeStatus(user.status) === 'banned').length || 0);
  const blockedAccounts = Number(overview?.blockedAccounts || users.filter((user) => ['banned', 'suspended'].includes(normalizeStatus(user.status))).length || 0);
  const premiumUsers = Number(overview?.premiumUsers || overview?.activeSubscriptions || users.filter((user) => ['premium', 'active', 'paid'].includes(normalizeStatus(user.subscription_status || user.membership_status))).length || 0);
  const monthlyRevenue = Number(overview?.monthlyRevenue || overview?.totalRevenue || sumInWindow(payments, paymentTimestamp, getWindow('this_month'), (payment) => normalizeStatus(payment.status) === 'approved', (payment) => payment.amount || payment.price || payment.total || 0));
  const pendingPaymentReviews = Number(overview?.pendingPaymentReviews || payments.filter((payment) => normalizeStatus(payment.status) === 'pending').length || 0);

  const systemHealth = overview?.systemHealth || {};
  const recentActivity = overview?.recentActivity || [];
  const notices = overview?.platformAlerts || [];
  const liveQueue = [
    { label: 'Registration Queue', value: pendingRegistrationApprovals, section: 'registration_approvals' },
    { label: 'Profile Queue', value: pendingProfileApprovals, section: 'approvals' },
    { label: 'Payment Queue', value: pendingPaymentReviews, section: 'payments' },
    { label: 'Reports Queue', value: activeReports, section: 'reports' }
  ];

  const growthBucketSet = buildBuckets(growthRange);
  const growthBuckets = growthBucketSet.buckets;
  const growthLabels = growthBuckets.map((bucket) => bucket.label);

  const newUsersSeries = aggregateSeries(users, growthBuckets, userTimestamp);
  const activeUsersSeries = aggregateSeries(users, growthBuckets, userActivityTimestamp);
  const approvedUsersSeries = aggregateSeries(
    users,
    growthBuckets,
    (user) => user?.approvedAt || user?.updatedAt || user?.createdAt,
    (user) => ['approved', 'active'].includes(normalizeStatus(user.profile_approval_status || user.status))
  );

  const globalBucketSet = buildBuckets(globalRange);
  const globalBuckets = globalBucketSet.buckets;
  const globalLabels = globalBuckets.map((bucket) => bucket.label);

  const registrationTotalSeries = aggregateSeries(approvals, globalBuckets, registrationTimestamp);
  const registrationApprovedSeries = aggregateSeries(
    approvals,
    globalBuckets,
    registrationTimestamp,
    (item) => ['approved', 'active'].includes(normalizeStatus(item?.status || item?.profile_approval_status || item?.registration_status))
  );
  const registrationRejectedSeries = aggregateSeries(
    approvals,
    globalBuckets,
    registrationTimestamp,
    (item) => ['rejected', 'declined'].includes(normalizeStatus(item?.status || item?.profile_approval_status || item?.registration_status))
  );
  const registrationPendingSeries = aggregateSeries(
    approvals,
    globalBuckets,
    registrationTimestamp,
    (item) => normalizeStatus(item?.status || item?.profile_approval_status || item?.registration_status) === 'pending'
  );

  const profileSubmittedSeries = aggregateSeries(profileApprovals, globalBuckets, profileTimestamp);
  const profileApprovedSeries = aggregateSeries(
    profileApprovals,
    globalBuckets,
    profileTimestamp,
    (item) => normalizeStatus(item?.profile_approval_status || item?.status) === 'approved'
  );
  const profileRejectedSeries = aggregateSeries(
    profileApprovals,
    globalBuckets,
    profileTimestamp,
    (item) => ['rejected', 'declined'].includes(normalizeStatus(item?.profile_approval_status || item?.status))
  );

  const reportTrendSeries = aggregateSeries(
    reports,
    globalBuckets,
    reportTimestamp,
    (item) => normalizeStatus(item?.status) !== 'resolved'
  );
  const flaggedTrendSeries = aggregateSeries(
    chats,
    globalBuckets,
    chatTimestamp,
    (chat) => Number(chat.riskScore || 0) >= 65 || Number(chat.reportCount || 0) > 0
  );
  const suspiciousTrendSeries = aggregateSeries(
    users,
    globalBuckets,
    userActivityTimestamp,
    (user) => Number(user.warnings_count || 0) > 1 || normalizeStatus(user.status) === 'banned'
  );
  const blockedTrendSeries = aggregateSeries(
    users,
    globalBuckets,
    userActivityTimestamp,
    (user) => ['banned', 'suspended'].includes(normalizeStatus(user.status))
  );

  const premiumPurchasesSeries = aggregateSeries(
    payments,
    globalBuckets,
    paymentTimestamp,
    (payment) => normalizeStatus(payment.status) === 'approved'
  );
  const revenueSeries = aggregateSeries(
    payments,
    globalBuckets,
    paymentTimestamp,
    (payment) => normalizeStatus(payment.status) === 'approved',
    (payment) => payment.amount || payment.price || payment.total || 0
  );
  const churnSeries = aggregateSeries(
    payments,
    globalBuckets,
    paymentTimestamp,
    (payment) => ['expired', 'cancelled', 'failed', 'rejected'].includes(normalizeStatus(payment.status))
  );

  const baselinePremium = Math.max(0, premiumUsers - premiumPurchasesSeries.reduce((acc, value) => acc + value, 0) + churnSeries.reduce((acc, value) => acc + value, 0));
  const activePremiumSeries = premiumPurchasesSeries.reduce((acc, value, idx) => {
    const previous = idx === 0 ? baselinePremium : acc[idx - 1];
    acc.push(Math.max(0, previous + value - (churnSeries[idx] || 0)));
    return acc;
  }, []);

  const now = new Date().getTime();
  const dailyActiveUsers = users.filter((user) => now - toEpoch(userActivityTimestamp(user)) <= 24 * 60 * 60 * 1000).length;
  const weeklyActiveUsers = users.filter((user) => now - toEpoch(userActivityTimestamp(user)) <= 7 * 24 * 60 * 60 * 1000).length;
  const monthlyActiveUsers = users.filter((user) => now - toEpoch(userActivityTimestamp(user)) <= 30 * 24 * 60 * 60 * 1000).length;

  const approvedRegistrationsCount = approvals.filter((item) => ['approved', 'active'].includes(normalizeStatus(item?.status || item?.profile_approval_status || item?.registration_status))).length;
  const rejectedRegistrationsCount = approvals.filter((item) => ['rejected', 'declined'].includes(normalizeStatus(item?.status || item?.profile_approval_status || item?.registration_status))).length;
  const approvalSuccessRate = approvedRegistrationsCount + rejectedRegistrationsCount > 0
    ? Math.round((approvedRegistrationsCount / (approvedRegistrationsCount + rejectedRegistrationsCount)) * 100)
    : 0;

  const premiumConversionRate = totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0;
  const moderationRiskScore = Math.min(
    100,
    ((activeReports * 3) + (flaggedChats * 2) + (suspiciousUsers * 2) + blockedAccounts) / Math.max(totalUsers, 1) * 1000
  );
  const moderationRiskLevel = moderationRiskScore < 20 ? 'low' : moderationRiskScore < 45 ? 'medium' : 'high';

  const expiredPremiumCount = users.filter((user) => normalizeStatus(user?.subscription_status || user?.membership_status) === 'expired').length + churnSeries.reduce((acc, value) => acc + value, 0);
  const blockedUserRatio = totalUsers > 0 ? (blockedAccounts / totalUsers) * 100 : 0;

  const averageApprovalTurnaroundHours = (() => {
    const resolvedProfiles = profileApprovals.filter((item) => ['approved', 'rejected', 'declined'].includes(normalizeStatus(item?.profile_approval_status || item?.status)));
    if (!resolvedProfiles.length) return 0;
    const durations = resolvedProfiles
      .map((item) => {
        const created = toEpoch(item?.created_at || item?.createdAt);
        const updated = toEpoch(item?.updated_at || item?.updatedAt);
        return created && updated && updated > created ? (updated - created) / (1000 * 60 * 60) : 0;
      })
      .filter((value) => value > 0);
    if (!durations.length) return 0;
    return durations.reduce((acc, value) => acc + value, 0) / durations.length;
  })();

  const averageModerationResolutionHours = (() => {
    const resolved = reports.filter((report) => normalizeStatus(report?.status) === 'resolved');
    if (!resolved.length) return 0;
    const durations = resolved
      .map((report) => {
        const created = toEpoch(report?.createdAt || report?.created_at);
        const updated = toEpoch(report?.updatedAt || report?.updated_at);
        return created && updated && updated > created ? (updated - created) / (1000 * 60 * 60) : 0;
      })
      .filter((value) => value > 0);
    if (!durations.length) return 0;
    return durations.reduce((acc, value) => acc + value, 0) / durations.length;
  })();

  const registrationCurrent = countInWindow(users, userTimestamp, globalWindow);
  const registrationPrevious = countInWindow(users, userTimestamp, previousWindow);
  const premiumCurrent = countInWindow(payments, paymentTimestamp, globalWindow, (payment) => normalizeStatus(payment.status) === 'approved');
  const premiumPrevious = countInWindow(payments, paymentTimestamp, previousWindow, (payment) => normalizeStatus(payment.status) === 'approved');
  const revenueCurrent = sumInWindow(payments, paymentTimestamp, globalWindow, (payment) => normalizeStatus(payment.status) === 'approved', (payment) => payment.amount || payment.price || payment.total || 0);
  const revenuePrevious = sumInWindow(payments, paymentTimestamp, previousWindow, (payment) => normalizeStatus(payment.status) === 'approved', (payment) => payment.amount || payment.price || payment.total || 0);

  const seriesIsEmpty = (seriesList) => seriesList.every((entry) => (entry.data || []).every((value) => Number(value || 0) === 0));

  const Sparkline = ({ points = [], tone = 'info' }) => {
    const colors = {
      info: '#22d3ee',
      success: '#34d399',
      warning: '#f59e0b',
      danger: '#fb7185'
    };
    const safePoints = points.length ? points : [0, 0, 0, 0, 0];
    const width = 120;
    const height = 34;
    const max = Math.max(...safePoints, 1);
    const min = Math.min(...safePoints, 0);
    const span = Math.max(1, max - min);
    const step = width / Math.max(1, safePoints.length - 1);
    const path = safePoints
      .map((value, index) => {
        const x = index * step;
        const y = height - ((value - min) / span) * (height - 4) - 2;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-9" preserveAspectRatio="none" role="img" aria-label="Trend sparkline">
        <polyline fill="none" stroke={colors[tone] || colors.info} strokeWidth="2.2" points={path} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  const KpiCard = ({ label, value, delta, helper, spark, tone = 'info' }) => {
    const toneStyles = {
      info: 'border-cyan-300/25 bg-cyan-500/10',
      success: 'border-emerald-300/25 bg-emerald-500/10',
      warning: 'border-amber-300/25 bg-amber-500/10',
      danger: 'border-rose-300/25 bg-rose-500/10'
    };
    const deltaTone = delta >= 0 ? 'text-emerald-200' : 'text-rose-200';

    return (
      <article className={`rounded-2xl border p-4 ${toneStyles[tone] || toneStyles.info}`} title={helper}>
        <p className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--portal-muted)]">{label}</p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <p className="text-2xl font-bold text-[color:var(--text-light)] leading-none">{value}</p>
          <span className={`text-xs font-semibold ${deltaTone}`}>{delta >= 0 ? '+' : ''}{delta.toFixed(1)}%</span>
        </div>
        <div className="mt-3">
          <Sparkline points={spark} tone={tone} />
        </div>
        <p className="mt-2 text-xs text-[color:var(--portal-muted)]">{helper}</p>
      </article>
    );
  };

  const LineAnalyticsChart = ({ labels = [], series = [], emptyCopy = 'No trend data available for this period.' }) => {
    const width = 900;
    const height = 260;
    const padding = 28;
    const maxValue = Math.max(1, ...series.flatMap((item) => item.data || [0]));
    const xStep = labels.length > 1 ? (width - padding * 2) / (labels.length - 1) : 0;
    const allZero = seriesIsEmpty(series);

    if (allZero) {
      return (
        <div className="rounded-xl border border-cyan-200/20 bg-white/5 px-4 py-7 text-sm text-[color:var(--portal-muted)]">
          {emptyCopy}
        </div>
      );
    }

    return (
      <div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64 rounded-xl border border-cyan-200/15 bg-[linear-gradient(180deg,rgba(148,163,184,0.08)_0%,rgba(15,23,42,0.12)_100%)]" role="img" aria-label="Analytics line chart">
          {[0, 1, 2, 3, 4].map((row) => {
            const y = padding + (row * (height - padding * 2)) / 4;
            return <line key={row} x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(148,163,184,0.15)" strokeWidth="1" />;
          })}

          {series.map((entry) => {
            const points = (entry.data || []).map((value, index) => {
              const x = padding + index * xStep;
              const y = height - padding - ((Number(value || 0) / maxValue) * (height - padding * 2));
              return { x, y, value };
            });

            const polyline = points.map((point) => `${point.x},${point.y}`).join(' ');

            return (
              <g key={entry.name}>
                <polyline fill="none" stroke={entry.color} strokeWidth="2.6" points={polyline} strokeLinecap="round" strokeLinejoin="round" />
                {points.map((point, index) => (
                  <circle key={`${entry.name}-${index}`} cx={point.x} cy={point.y} r="2.7" fill={entry.color}>
                    <title>{`${entry.name}: ${Number(point.value || 0).toLocaleString('en-IN')}`}</title>
                  </circle>
                ))}
              </g>
            );
          })}
        </svg>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          {series.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2 text-xs text-[color:var(--portal-muted)]">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const StackedFlowChart = ({ labels = [], series = [], emptyCopy = 'Pipeline trend will appear once registrations start flowing.' }) => {
    const allZero = seriesIsEmpty(series);
    if (allZero) {
      return <div className="rounded-xl border border-cyan-200/20 bg-white/5 px-4 py-7 text-sm text-[color:var(--portal-muted)]">{emptyCopy}</div>;
    }

    const bucketCount = labels.length;
    const stackedTotals = Array.from({ length: bucketCount }, (_, index) => series.reduce((acc, entry) => acc + Number(entry.data?.[index] || 0), 0));
    const max = Math.max(1, ...stackedTotals);

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-8 md:grid-cols-10 gap-2 items-end h-52 rounded-xl border border-cyan-200/15 bg-white/5 p-3">
          {stackedTotals.map((total, index) => (
            <div key={index} className="h-full flex items-end">
              <div className="w-full rounded-lg overflow-hidden border border-cyan-300/15" style={{ height: `${Math.max(8, (total / max) * 100)}%` }}>
                {series.map((entry) => {
                  const value = Number(entry.data?.[index] || 0);
                  const heightPct = total > 0 ? (value / total) * 100 : 0;
                  return <div key={`${entry.name}-${index}`} style={{ height: `${heightPct}%`, background: entry.color }} title={`${entry.name}: ${value}`} />;
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {series.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2 text-xs text-[color:var(--portal-muted)]">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const activityHeatmap = React.useMemo(() => {
    const matrix = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
    const eventPool = [
      ...chats.map((item) => chatTimestamp(item)),
      ...activityLogs.map((item) => activityTimestamp(item)),
      ...users.map((item) => userActivityTimestamp(item))
    ];

    for (const value of eventPool) {
      const ts = toEpoch(value);
      if (!ts || ts < globalWindow.start || ts > globalWindow.end) continue;
      const d = new Date(ts);
      matrix[d.getDay()][d.getHours()] += 1;
    }
    return matrix;
  }, [activityLogs, chats, globalWindow.end, globalWindow.start, toEpoch, users]);

  const heatmapMax = Math.max(1, ...activityHeatmap.flat());
  const hourTotals = Array.from({ length: 24 }, (_, hour) => activityHeatmap.reduce((acc, dayRow) => acc + dayRow[hour], 0));
  const dayTotals = activityHeatmap.map((dayRow) => dayRow.reduce((acc, value) => acc + value, 0));
  const peakHour = hourTotals.indexOf(Math.max(...hourTotals));
  const peakDay = dayTotals.indexOf(Math.max(...dayTotals));
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const insights = [];
  insights.push(`${registrationCurrent} users joined in ${globalWindow.label}.`);
  insights.push(`Registrations ${deltaLabel(registrationCurrent, registrationPrevious)} vs prior period.`);
  insights.push(`Profile approval success rate is ${approvalSuccessRate}%.`);
  insights.push(`Moderation risk is ${moderationRiskLevel} (${moderationRiskScore.toFixed(1)} score).`);
  insights.push(pendingPaymentReviews === 0 ? 'No urgent payment backlog detected.' : `${pendingPaymentReviews} payments currently need review.`);
  insights.push(`Strongest activity is around ${peakHour}:00 on ${dayLabels[peakDay]}.`);
  insights.push(pctDelta(premiumCurrent, premiumPrevious) < 0 ? 'Premium conversion softened this period; revisit upgrade nudges.' : 'Premium conversion momentum remains healthy.');
  insights.push(pendingProfileApprovals > 0 ? `${pendingProfileApprovals} profiles need immediate review.` : 'Profile review queue is currently clear.');

  const decisionBlocks = [
    {
      title: 'Users needing review',
      value: suspiciousUsers,
      helper: suspiciousUsers > 0 ? 'Prioritize warning-heavy and risk-scored accounts.' : 'No high-risk user cluster detected.',
      action: 'users',
      tone: suspiciousUsers > 0 ? 'danger' : 'success'
    },
    {
      title: 'Profiles needing review',
      value: pendingProfileApprovals,
      helper: pendingProfileApprovals > 5 ? 'Approval bottleneck detected. Assign additional reviewer.' : 'Approval pipeline remains healthy.',
      action: 'approvals',
      tone: pendingProfileApprovals > 5 ? 'warning' : 'success'
    },
    {
      title: 'Payment backlog',
      value: pendingPaymentReviews,
      helper: pendingPaymentReviews > 0 ? 'Finance queue requires action to protect conversion.' : 'No urgent payment backlog.',
      action: 'payments',
      tone: pendingPaymentReviews > 0 ? 'warning' : 'success'
    },
    {
      title: 'Risk alerts',
      value: activeReports + flaggedChats,
      helper: activeReports + flaggedChats > 0 ? 'Review safety signals to keep trust metrics stable.' : 'No moderation spikes detected this period.',
      action: 'reports',
      tone: activeReports + flaggedChats > 0 ? 'danger' : 'success'
    }
  ];

  const kpiCards = [
    {
      label: 'Total Users',
      value: formatCompact(totalUsers),
      delta: pctDelta(registrationCurrent, registrationPrevious),
      helper: `Joined ${globalWindow.label}`,
      spark: newUsersSeries,
      tone: 'info'
    },
    {
      label: 'DAU / WAU / MAU',
      value: `${formatCompact(dailyActiveUsers)} / ${formatCompact(weeklyActiveUsers)} / ${formatCompact(monthlyActiveUsers)}`,
      delta: pctDelta(dailyActiveUsers, Math.max(1, Math.round(weeklyActiveUsers / 7))),
      helper: 'Active audience across daily, weekly, and monthly windows.',
      spark: activeUsersSeries,
      tone: 'success'
    },
    {
      label: 'Premium Conversion',
      value: `${premiumConversionRate.toFixed(1)}%`,
      delta: pctDelta(premiumCurrent, premiumPrevious),
      helper: 'Share of users on paid access.',
      spark: activePremiumSeries,
      tone: pctDelta(premiumCurrent, premiumPrevious) < 0 ? 'warning' : 'success'
    },
    {
      label: 'Approval Success Rate',
      value: `${approvalSuccessRate}%`,
      delta: pctDelta(
        registrationApprovedSeries.reduce((acc, value) => acc + value, 0),
        Math.max(1, registrationRejectedSeries.reduce((acc, value) => acc + value, 0))
      ),
      helper: 'Approved vs rejected registration decisions.',
      spark: registrationApprovedSeries,
      tone: approvalSuccessRate >= 75 ? 'success' : 'warning'
    },
    {
      label: 'Moderation Risk',
      value: `${moderationRiskScore.toFixed(1)} (${moderationRiskLevel})`,
      delta: pctDelta(activeReports + flaggedChats, Math.max(1, suspiciousUsers + blockedAccounts)),
      helper: 'Composite risk from open reports, flagged chat, suspicious users.',
      spark: reportTrendSeries,
      tone: moderationRiskLevel === 'high' ? 'danger' : moderationRiskLevel === 'medium' ? 'warning' : 'success'
    },
    {
      label: 'Revenue This Month',
      value: formatCurrency(monthlyRevenue),
      delta: pctDelta(revenueCurrent, revenuePrevious),
      helper: 'Approved premium payment volume.',
      spark: revenueSeries,
      tone: revenueCurrent >= revenuePrevious ? 'success' : 'warning'
    },
    {
      label: 'Churn / Expired Premium',
      value: formatCompact(expiredPremiumCount),
      delta: pctDelta(churnSeries.reduce((acc, value) => acc + value, 0), Math.max(1, premiumPurchasesSeries.reduce((acc, value) => acc + value, 0))),
      helper: 'Premium expiries and payment falloff signals.',
      spark: churnSeries,
      tone: expiredPremiumCount > premiumUsers * 0.25 ? 'danger' : 'warning'
    },
    {
      label: 'Blocked User Ratio',
      value: `${blockedUserRatio.toFixed(2)}%`,
      delta: pctDelta(blockedAccounts, Math.max(1, suspiciousUsers)),
      helper: 'Share of users currently banned or suspended.',
      spark: blockedTrendSeries,
      tone: blockedUserRatio > 2 ? 'warning' : 'info'
    }
  ];

  const growthSeries = [
    { name: 'New users', color: '#22d3ee', data: newUsersSeries },
    { name: 'Active users', color: '#34d399', data: activeUsersSeries },
    { name: 'Approved users', color: '#f59e0b', data: approvedUsersSeries }
  ];

  const registrationSeries = [
    { name: 'Registrations', color: 'linear-gradient(180deg,#38bdf8,#0ea5e9)', data: registrationTotalSeries },
    { name: 'Approved', color: 'linear-gradient(180deg,#34d399,#10b981)', data: registrationApprovedSeries },
    { name: 'Rejected', color: 'linear-gradient(180deg,#fb7185,#f43f5e)', data: registrationRejectedSeries },
    { name: 'Pending', color: 'linear-gradient(180deg,#f59e0b,#d97706)', data: registrationPendingSeries }
  ];

  const moderationSeries = [
    { name: 'Active reports', color: '#fb7185', data: reportTrendSeries },
    { name: 'Flagged chats', color: '#f59e0b', data: flaggedTrendSeries },
    { name: 'Suspicious users', color: '#22d3ee', data: suspiciousTrendSeries },
    { name: 'Blocked accounts', color: '#a78bfa', data: blockedTrendSeries }
  ];

  const revenueTrendSeries = [
    { name: 'Premium purchases', color: '#34d399', data: premiumPurchasesSeries },
    { name: 'Revenue', color: '#22d3ee', data: revenueSeries },
    { name: 'Active premium users', color: '#f59e0b', data: activePremiumSeries },
    { name: 'Expiry / churn', color: '#fb7185', data: churnSeries }
  ];

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            delta={kpi.delta}
            helper={kpi.helper}
            spark={kpi.spark}
            tone={kpi.tone}
          />
        ))}
      </div>

      <div className="grid xl:grid-cols-[1.45fr_1fr] gap-4">
        <PremiumSurface
          title="User Growth Analytics"
          subtitle="New, active, and approved user trends"
          rightSlot={(
            <div className="flex items-center gap-2">
              {[
                { id: '7d', label: '7d' },
                { id: '30d', label: '30d' },
                { id: '90d', label: '90d' },
                { id: '12m', label: '12m' }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setGrowthRange(item.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs border transition ${growthRange === item.id ? 'border-cyan-300/60 bg-cyan-500/20 text-cyan-100' : 'border-cyan-200/20 bg-white/5 text-slate-300 hover:bg-white/10'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        >
          <LineAnalyticsChart
            labels={growthLabels}
            series={growthSeries}
            emptyCopy="User growth trend will become visible as registrations accumulate."
          />
        </PremiumSurface>

        <PremiumSurface title="Live Platform Insights" subtitle="Real-time operations intelligence" rightSlot={<StatusChip tone="info">Platform Pulse</StatusChip>}>
          <div className="space-y-2.5">
            {insights.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-xl border border-cyan-200/20 bg-white/5 px-3 py-2.5 text-sm text-[color:var(--text-light)]">
                {item}
              </div>
            ))}
          </div>
        </PremiumSurface>
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        <PremiumSurface title="Registration + Approval Flow" subtitle={`Onboarding pipeline across ${globalBucketSet.label}`}>
          <StackedFlowChart
            labels={globalLabels}
            series={registrationSeries}
            emptyCopy="No registration flow yet. New onboarding events will populate this panel."
          />
        </PremiumSurface>

        <PremiumSurface title="Moderation / Safety Trend" subtitle="Reports, flags, suspicious behavior and blocked users over time">
          <LineAnalyticsChart
            labels={globalLabels}
            series={moderationSeries}
            emptyCopy="No moderation spikes detected this period."
          />
        </PremiumSurface>
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        <PremiumSurface title="Revenue / Premium Trend" subtitle="Purchases, revenue, active premium users, and churn">
          <LineAnalyticsChart
            labels={globalLabels}
            series={revenueTrendSeries}
            emptyCopy="Premium revenue will appear here once subscriptions begin."
          />
        </PremiumSurface>

        <PremiumSurface title="Activity Pattern Heatmap" subtitle="Most active hours and days for engagement and admin load">
          <div className="space-y-4">
            <div className="grid grid-cols-[auto_repeat(24,minmax(0,1fr))] gap-1.5 overflow-x-auto">
              <div />
              {Array.from({ length: 24 }, (_, hour) => (
                <div key={`hour-${hour}`} className="text-[10px] text-[color:var(--portal-muted)] text-center">{hour}</div>
              ))}

              {dayLabels.map((day, dayIndex) => (
                <React.Fragment key={day}>
                  <div className="text-[10px] text-[color:var(--portal-muted)] pr-1 self-center">{day}</div>
                  {activityHeatmap[dayIndex].map((value, hourIndex) => {
                    const intensity = value / heatmapMax;
                    const background = `rgba(34,211,238,${0.08 + intensity * 0.75})`;
                    return (
                      <div
                        key={`${day}-${hourIndex}`}
                        className="h-4 rounded-[4px] border border-cyan-200/10"
                        style={{ backgroundColor: background }}
                        title={`${day} ${hourIndex}:00 - ${value} events`}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-cyan-200/20 bg-white/5 px-3 py-3 text-sm text-[color:var(--text-light)]">
                Most active hour: <span className="font-semibold">{peakHour}:00</span>
              </div>
              <div className="rounded-xl border border-cyan-200/20 bg-white/5 px-3 py-3 text-sm text-[color:var(--text-light)]">
                Most active day: <span className="font-semibold">{dayLabels[peakDay]}</span>
              </div>
            </div>
          </div>
        </PremiumSurface>
      </div>

      <div className="grid xl:grid-cols-[1.2fr_1fr_1fr] gap-4">
        <PremiumSurface title="Profile Approval Trend" subtitle="Submitted vs approved vs rejected profiles">
          <LineAnalyticsChart
            labels={globalLabels}
            series={[
              { name: 'Submitted', color: '#22d3ee', data: profileSubmittedSeries },
              { name: 'Approved', color: '#34d399', data: profileApprovedSeries },
              { name: 'Rejected', color: '#fb7185', data: profileRejectedSeries }
            ]}
            emptyCopy="Profile review trend will appear after moderation actions begin."
          />
        </PremiumSurface>

        <PremiumSurface title="System Health" subtitle="Core platform services + response readiness">
          <div className="space-y-2">
            {[
              { label: 'API', value: systemHealth.api || 'healthy' },
              { label: 'Database', value: systemHealth.database || 'healthy' },
              { label: 'Payments', value: systemHealth.payments || 'degraded' },
              { label: 'Storage', value: systemHealth.storage || 'healthy' },
              { label: 'Safety', value: systemHealth.safety || (moderationRiskLevel === 'high' ? 'degraded' : 'healthy') }
            ].map((item) => {
              const tone = item.value === 'healthy' ? 'success' : item.value === 'degraded' ? 'warning' : 'danger';
              return (
                <div key={item.label} className="flex items-center justify-between rounded-xl border border-cyan-200/15 bg-white/5 px-3 py-2">
                  <span className="text-sm text-[color:var(--text-light)]">{item.label}</span>
                  <StatusChip tone={tone}>{item.value}</StatusChip>
                </div>
              );
            })}

            <div className="rounded-xl border border-cyan-200/20 bg-white/5 px-3 py-2.5 mt-3 text-xs text-[color:var(--portal-muted)]">
              Avg approval turnaround: {averageApprovalTurnaroundHours > 0 ? `${averageApprovalTurnaroundHours.toFixed(1)}h` : 'N/A'}
            </div>
            <div className="rounded-xl border border-cyan-200/20 bg-white/5 px-3 py-2.5 text-xs text-[color:var(--portal-muted)]">
              Avg moderation resolution: {averageModerationResolutionHours > 0 ? `${averageModerationResolutionHours.toFixed(1)}h` : 'N/A'}
            </div>
          </div>
        </PremiumSurface>

        <PremiumSurface title="Smart Decision Support" subtitle="What to act on next">
          <div className="space-y-2.5">
            {decisionBlocks.map((block) => (
              <button
                key={block.title}
                type="button"
                onClick={() => onSectionChange?.(block.action)}
                className="w-full text-left rounded-xl border border-cyan-200/20 bg-white/5 hover:bg-white/10 px-3 py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs uppercase tracking-wide text-[color:var(--portal-muted)]">{block.title}</p>
                  <StatusChip tone={block.tone}>{formatCompact(block.value)}</StatusChip>
                </div>
                <p className="text-sm text-[color:var(--text-light)] mt-1.5">{block.helper}</p>
              </button>
            ))}
          </div>
        </PremiumSurface>
      </div>

      <div className="grid xl:grid-cols-[1.1fr_1fr_1fr] gap-4">
        <PremiumSurface title="Recent Admin Activity" subtitle="Latest governance actions">
          {(recentActivity.length || activityLogs.length) ? (
            <div className="space-y-2.5">
              {(recentActivity.length ? recentActivity : activityLogs).slice(0, 8).map((entry, idx) => (
                <div key={entry._id || idx} className="rounded-xl border border-cyan-200/15 bg-white/5 px-3 py-2.5">
                  <p className="text-sm text-[color:var(--text-light)]">{entry.description || entry.action || 'Activity update'}</p>
                  <p className="text-xs text-[color:var(--portal-muted)] mt-1">{new Date(entry.timestamp || entry.createdAt || new Date().getTime()).toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-cyan-200/15 bg-white/5 px-3 py-4 text-sm text-[color:var(--portal-muted)]">
              No recent admin actions. Activity will appear as the team starts reviewing queues.
            </div>
          )}
        </PremiumSurface>

        <PremiumSurface title="Safety & Moderation Notices" subtitle="Priority alerts for trust operations">
          {notices.length ? (
            <div className="space-y-2">
              {notices.map((alert, idx) => (
                <div key={`${alert}-${idx}`} className="rounded-xl border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">{alert}</div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-200">No moderation spikes detected this period.</div>
          )}
        </PremiumSurface>

        <PremiumSurface title="Live Queue Panel" subtitle="Operational backlog and throughput">
          <div className="space-y-2.5">
            {liveQueue.map((queue) => (
              <button
                key={queue.label}
                onClick={() => onSectionChange?.(queue.section)}
                className="w-full text-left rounded-xl border border-cyan-200/20 bg-white/5 hover:bg-white/10 px-4 py-3"
              >
                <p className="text-xs uppercase tracking-wide text-[color:var(--portal-muted)]">{queue.label}</p>
                <p className="text-2xl font-semibold text-[color:var(--text-light)] mt-1">{queue.value}</p>
                <p className="text-xs text-cyan-200 mt-1">Open queue</p>
              </button>
            ))}
          </div>
        </PremiumSurface>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Active Today', value: activeToday, icon: '🟢', hint: 'Engaged in last 24h', tone: 'success' },
          { label: 'New Registrations', value: newRegistrations, icon: '🆕', hint: 'Joined in selected period', tone: 'info' },
          { label: 'Pending Profile Approvals', value: pendingProfileApprovals, icon: '✅', hint: 'Verification queue', tone: 'warning' },
          { label: 'Pending Payment Reviews', value: pendingPaymentReviews, icon: '💳', hint: 'Needs finance action', tone: 'warning' }
        ].map((card) => (
          <StatCard
            key={card.label}
            icon={card.icon}
            label={card.label}
            value={card.value}
            hint={card.hint}
            tone={card.tone}
          />
        ))}
      </div>
    </div>
  );
}

function UsersPanel({ users, onModerate, onDelete, onOpenDetail, onViewActivity, onNotify }) {
  const exportUsers = () => {
    if (!users || users.length === 0) {
      onNotify?.('No user data to export', 'error');
      return;
    }

    try {
      // Prepare export data
      const exportData = users.map(u => ({
        'User ID': u._id || '',
        'Name': u.name || '',
        'Email': u.email || '',
        'Status': u.status || 'active',
        'profile_approval_status': u.profile_approval_status || 'pending',
        'Subscription': u.subscription_status || 'none',
        'College': u.college?.name || u.college || '',
        'Course': u.course || '',
        'Joined Date': u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
        'Photos Verified': u.photosVerified ? 'Yes' : 'No',
        'Email Verified': u.isEmailVerified ? 'Yes' : 'No'
      }));

      // Export to CSV
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(h => {
            const val = row[h];
            if (val === null || val === undefined) return '';
            const str = String(val);
            return str.includes(',') || str.includes('"') || str.includes('\n') 
              ? `"${str.replace(/"/g, '""')}"` 
              : str;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      onNotify?.('Failed to export users', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={exportUsers}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-medium"
        >
          📥 Export Users to CSV
        </button>
      </div>
      <TablePanel
        title="User Management"
        columns={['Name', 'Email', 'Status', 'Profile', 'Subscription', 'Actions']}
        rows={users.map((user) => [
          user.name,
          user.email,
          user.status,
          user.profile_approval_status || 'pending',
          user.subscription_status || 'none',
          <div key={user._id} className="flex gap-2 flex-wrap">
            <button className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700" onClick={() => onOpenDetail('User Detail', user)}>Detail</button>
            <button className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700" onClick={() => onViewActivity(user._id)}>User Activity</button>
            <button className="text-xs px-2 py-1 rounded bg-red-100 text-red-700" onClick={() => onModerate(user._id, 'ban')}>Ban</button>
            <button className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800" onClick={() => onModerate(user._id, 'warn')}>Warn</button>
            <button className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700" onClick={() => onModerate(user._id, 'freeze_chat')}>Freeze Chat</button>
            <button className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 font-bold" onClick={() => onDelete(user._id, user.name)}>🗑️ DELETE</button>
          </div>
        ])}
        pageSize={10}
      />
    </div>
  );
}

function RegistrationApprovalsPanel({
  registrations,
  onApprove,
  onOpenDetail,
  onNotify,
  pinEnabled = false,
  pinVerified = false,
  adminPin = ''
}) {
  const [query, setQuery] = React.useState('');
  const [riskFilter, setRiskFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('pending');
  const [selectedIds, setSelectedIds] = React.useState([]);
  const [loadingIds, setLoadingIds] = React.useState([]);
  const [fadingIds, setFadingIds] = React.useState([]);
  const [shakingIds, setShakingIds] = React.useState([]);
  const [lastUpdatedAt, setLastUpdatedAt] = React.useState(() => new Date().getTime());
  const [clockTick, setClockTick] = React.useState(() => new Date().getTime());
  const [rejectModal, setRejectModal] = React.useState({ open: false, user: null, reason: 'Profile does not meet requirements' });
  const [bulkRejectModal, setBulkRejectModal] = React.useState({ open: false, reason: 'Bulk rejection by admin review' });
  const [auditTrail, setAuditTrail] = React.useState([]);
  const [page, setPage] = React.useState(1);
  const pageSize = 8;

  React.useEffect(() => {
    setLastUpdatedAt(Date.now());
    setSelectedIds((prev) => prev.filter((id) => (registrations || []).some((item) => item._id === id)));
  }, [registrations]);

  React.useEffect(() => {
    const interval = window.setInterval(() => setClockTick(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const relativeTime = React.useCallback((value) => {
    const ts = new Date(value || 0).getTime();
    if (!Number.isFinite(ts) || ts <= 0) return 'unknown';
    const diffMs = Math.max(0, Date.now() - ts);
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min} min ago`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }, []);

  const getAvatar = React.useCallback((user) => {
    const name = String(user?.name || 'U').trim();
    const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
    return initials || 'U';
  }, []);

  const deriveRiskFlags = React.useCallback((user, allUsers) => {
    const flags = [];
    const email = String(user?.email || user?.collegeEmail || user?.personalEmail || '').toLowerCase();
    const phone = String(user?.phone || '');
    const duplicateEmail = allUsers.filter((item) => String(item?.email || item?.collegeEmail || item?.personalEmail || '').toLowerCase() === email).length > 1;
    const duplicatePhone = phone && allUsers.filter((item) => String(item?.phone || '') === phone).length > 1;

    if (/@(mailinator|10minutemail|tempmail|guerrillamail)\./i.test(email)) {
      flags.push('Suspicious email');
    }
    if (duplicateEmail || duplicatePhone) {
      flags.push('Duplicate account');
    }
    if ((user?.bio && String(user.bio).length < 8) || /test|asdf|spam/i.test(String(user?.name || ''))) {
      flags.push('Spam risk');
    }

    return flags;
  }, []);

  const enrichedRows = React.useMemo(() => {
    return (registrations || []).map((user) => {
      const riskFlags = deriveRiskFlags(user, registrations || []);
      const riskLevel = riskFlags.length >= 2 ? 'high' : riskFlags.length === 1 ? 'medium' : 'low';
      const createdAt = user.created_at || user.createdAt;
      const status = String(user.profile_approval_status || user.status || 'pending').toLowerCase();
      return {
        ...user,
        displayEmail: user.email || user.collegeEmail || user.personalEmail || '-',
        createdAt,
        relativeSubmitted: relativeTime(createdAt),
        riskFlags,
        riskLevel,
        status
      };
    });
  }, [deriveRiskFlags, registrations, relativeTime]);

  const filteredRows = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return enrichedRows.filter((row) => {
      const matchesSearch = !normalized || `${row.name || ''} ${row.displayEmail || ''} ${row.phone || ''} ${row.course || ''}`.toLowerCase().includes(normalized);
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
      const matchesRisk = riskFilter === 'all' || row.riskLevel === riskFilter;
      return matchesSearch && matchesStatus && matchesRisk;
    });
  }, [enrichedRows, query, riskFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageRows = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page]);

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const approvedToday = auditTrail.filter((item) => item.action === 'approve' && item.timestamp >= startOfToday).length;
  const rejectedToday = auditTrail.filter((item) => item.action === 'reject' && item.timestamp >= startOfToday).length;

  const activeFilters = [
    query ? `Search: ${query}` : '',
    statusFilter !== 'all' ? `Status: ${statusFilter}` : '',
    riskFilter !== 'all' ? `Risk: ${riskFilter}` : ''
  ].filter(Boolean);

  const lastUpdatedLabel = React.useMemo(() => {
    const sec = Math.max(0, Math.floor((clockTick - lastUpdatedAt) / 1000));
    if (sec < 2) return 'just now';
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    return `${min}m ago`;
  }, [clockTick, lastUpdatedAt]);

  const canRunSensitiveAction = !pinEnabled || pinVerified || Boolean(adminPin);

  const pushAudit = React.useCallback((entry) => {
    setAuditTrail((prev) => [{ ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, timestamp: Date.now() }, ...prev].slice(0, 20));
  }, []);

  const runApprove = React.useCallback(async (userId, userName) => {
    if (!canRunSensitiveAction) {
      onNotify?.('Verify admin PIN before approval actions.', 'error');
      return;
    }

    setLoadingIds((prev) => [...new Set([...prev, userId])]);
    const ok = await onApprove?.(userId, 'approve', { deferRemovalMs: 260 });
    setLoadingIds((prev) => prev.filter((id) => id !== userId));

    if (ok) {
      setFadingIds((prev) => [...new Set([...prev, userId])]);
      window.setTimeout(() => {
        setFadingIds((prev) => prev.filter((id) => id !== userId));
      }, 450);
      setSelectedIds((prev) => prev.filter((id) => id !== userId));
      pushAudit({ action: 'approve', userId, userName, note: 'Approved from registration queue' });
      onNotify?.('User approved successfully', 'success');
    }
  }, [canRunSensitiveAction, onApprove, onNotify, pushAudit]);

  const confirmReject = React.useCallback(async () => {
    const user = rejectModal.user;
    if (!user) return;
    if (!canRunSensitiveAction) {
      onNotify?.('Verify admin PIN before rejection actions.', 'error');
      return;
    }
    const reason = String(rejectModal.reason || '').trim();
    if (reason.length < 4) {
      onNotify?.('Please provide a stronger rejection reason.', 'error');
      return;
    }

    setLoadingIds((prev) => [...new Set([...prev, user._id])]);
    const ok = await onApprove?.(user._id, 'reject', { reason, deferRemovalMs: 280 });
    setLoadingIds((prev) => prev.filter((id) => id !== user._id));

    if (ok) {
      setShakingIds((prev) => [...new Set([...prev, user._id])]);
      window.setTimeout(() => setShakingIds((prev) => prev.filter((id) => id !== user._id)), 380);
      setFadingIds((prev) => [...new Set([...prev, user._id])]);
      window.setTimeout(() => {
        setFadingIds((prev) => prev.filter((id) => id !== user._id));
      }, 500);
      setSelectedIds((prev) => prev.filter((id) => id !== user._id));
      pushAudit({ action: 'reject', userId: user._id, userName: user.name, note: reason });
      onNotify?.('Registration rejected with confirmation', 'success');
      setRejectModal({ open: false, user: null, reason: 'Profile does not meet requirements' });
    }
  }, [canRunSensitiveAction, onApprove, onNotify, pushAudit, rejectModal]);

  const handleBulkApprove = React.useCallback(async () => {
    if (!selectedIds.length) return;
    if (!canRunSensitiveAction) {
      onNotify?.('Verify admin PIN before bulk actions.', 'error');
      return;
    }

    setLoadingIds((prev) => [...new Set([...prev, ...selectedIds])]);
    for (const id of selectedIds) {
      const row = enrichedRows.find((item) => item._id === id);
      const ok = await onApprove?.(id, 'approve', { deferRemovalMs: 220 });
      if (ok) {
        pushAudit({ action: 'approve', userId: id, userName: row?.name || 'User', note: 'Bulk approve' });
      }
    }
    setLoadingIds((prev) => prev.filter((id) => !selectedIds.includes(id)));
    setSelectedIds([]);
    onNotify?.('Bulk approve completed', 'success');
  }, [canRunSensitiveAction, enrichedRows, onApprove, onNotify, pushAudit, selectedIds]);

  const handleBulkReject = React.useCallback(async () => {
    if (!selectedIds.length) return;
    if (!canRunSensitiveAction) {
      onNotify?.('Verify admin PIN before bulk actions.', 'error');
      return;
    }
    const reason = String(bulkRejectModal.reason || '').trim();
    if (reason.length < 4) {
      onNotify?.('Bulk reject reason is required.', 'error');
      return;
    }

    setLoadingIds((prev) => [...new Set([...prev, ...selectedIds])]);
    for (const id of selectedIds) {
      const row = enrichedRows.find((item) => item._id === id);
      const ok = await onApprove?.(id, 'reject', { reason, deferRemovalMs: 220 });
      if (ok) {
        pushAudit({ action: 'reject', userId: id, userName: row?.name || 'User', note: `Bulk reject: ${reason}` });
      }
    }
    setLoadingIds((prev) => prev.filter((id) => !selectedIds.includes(id)));
    setSelectedIds([]);
    setBulkRejectModal({ open: false, reason: 'Bulk rejection by admin review' });
    onNotify?.('Bulk reject completed', 'success');
  }, [bulkRejectModal.reason, canRunSensitiveAction, enrichedRows, onApprove, onNotify, pushAudit, selectedIds]);

  const allVisibleSelected = pageRows.length > 0 && pageRows.every((row) => selectedIds.includes(row._id));

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageRows.some((row) => row._id === id)));
      return;
    }
    setSelectedIds((prev) => [...new Set([...prev, ...pageRows.map((row) => row._id)])]);
  };

  if (!registrations) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PremiumSurface
        title="Pending Registrations"
        subtitle="Decision queue for onboarding approvals"
        rightSlot={<StatusChip tone="info">Last updated {lastUpdatedLabel}</StatusChip>}
      >
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-cyan-200/20 bg-white/5 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.15em] text-[color:var(--portal-muted)]">Total Pending</p>
            <p className="text-2xl font-bold text-[color:var(--text-light)] mt-1">{registrations.length}</p>
          </div>
          <div className="rounded-xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.15em] text-emerald-200">Approved Today</p>
            <p className="text-2xl font-bold text-emerald-100 mt-1">{approvedToday}</p>
          </div>
          <div className="rounded-xl border border-rose-300/20 bg-rose-500/10 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.15em] text-rose-200">Rejected Today</p>
            <p className="text-2xl font-bold text-rose-100 mt-1">{rejectedToday}</p>
          </div>
        </div>
      </PremiumSurface>

      <PremiumSurface title="Search & Filters" subtitle="Refine queue quickly with active filter chips">
        <div className="space-y-3">
          <div className="grid md:grid-cols-[1.2fr_auto_auto] gap-3 items-center">
            <label className="flex items-center gap-2 rounded-xl border border-cyan-200/20 bg-white/8 px-3 py-2.5">
              <span className="text-cyan-200">🔎</span>
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search name, email, phone, course"
                className="flex-1 bg-transparent text-sm text-[color:var(--text-light)] placeholder-slate-400 focus:outline-none"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setPage(1);
              }}
              className="px-3 py-2.5 rounded-full border border-cyan-200/20 bg-white/8 text-sm text-[color:var(--text-light)]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={riskFilter}
              onChange={(event) => {
                setRiskFilter(event.target.value);
                setPage(1);
              }}
              className="px-3 py-2.5 rounded-full border border-cyan-200/20 bg-white/8 text-sm text-[color:var(--text-light)]"
            >
              <option value="all">All Risk</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[color:var(--portal-muted)] uppercase tracking-wider">Active filters:</span>
            {activeFilters.length ? activeFilters.map((label) => (
              <span key={label} className="px-2.5 py-1 rounded-full border border-cyan-200/25 bg-cyan-500/10 text-cyan-100 text-xs">{label}</span>
            )) : <span className="text-xs text-[color:var(--portal-muted)]">None</span>}
          </div>
        </div>
      </PremiumSurface>

      <PremiumSurface title="Registration Queue" subtitle="Select and process users with fast action controls">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="inline-flex items-center gap-2 text-xs text-[color:var(--portal-muted)]">
              <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAllVisible} className="accent-cyan-400" />
              Select page ({pageRows.length})
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!selectedIds.length || loadingIds.length > 0}
                onClick={handleBulkApprove}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-500 disabled:opacity-40"
              >
                ✅ Bulk Approve ({selectedIds.length})
              </button>
              <button
                type="button"
                disabled={!selectedIds.length || loadingIds.length > 0}
                onClick={() => setBulkRejectModal({ open: true, reason: bulkRejectModal.reason })}
                className="px-3 py-2 rounded-xl text-xs font-semibold border border-rose-300/40 text-rose-200 hover:bg-rose-500/10 disabled:opacity-40"
              >
                ⛔ Bulk Reject ({selectedIds.length})
              </button>
            </div>
          </div>

          {!filteredRows.length ? (
            <div className="rounded-2xl border border-emerald-300/25 bg-emerald-500/10 px-6 py-10 text-center">
              <div className="text-4xl">🎉</div>
              <h3 className="mt-2 text-xl font-bold text-emerald-100">No pending approvals</h3>
              <p className="text-sm text-emerald-200/80 mt-1">All registrations are processed. New submissions will appear here automatically.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pageRows.map((user) => {
                const isLoadingRow = loadingIds.includes(user._id);
                const isFading = fadingIds.includes(user._id);
                const isShaking = shakingIds.includes(user._id);
                const selected = selectedIds.includes(user._id);
                const statusTone = user.status === 'approved' ? 'success' : user.status === 'rejected' ? 'danger' : 'warning';

                return (
                  <article
                    key={user._id}
                    onClick={() => onOpenDetail?.('Registration Detail', user)}
                    className={`rounded-2xl border border-cyan-200/20 bg-white/5 p-3.5 transition-all duration-300 cursor-pointer hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-[0_20px_44px_rgba(2,8,25,0.42)] ${isFading ? 'opacity-0 scale-[0.98]' : 'opacity-100'} ${isShaking ? 'animate-[shake_0.35s_ease-in-out]' : ''}`}
                  >
                    <div className="grid md:grid-cols-[auto_1fr_auto] gap-3 items-start">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selected}
                          onClick={(event) => event.stopPropagation()}
                          onChange={() => setSelectedIds((prev) => selected ? prev.filter((id) => id !== user._id) : [...prev, user._id])}
                          className="accent-cyan-400"
                        />
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400/35 to-blue-500/30 border border-cyan-200/30 text-cyan-100 font-bold flex items-center justify-center">
                          {getAvatar(user)}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-[color:var(--text-light)] truncate">{user.name || 'Unnamed User'}</p>
                          <StatusChip tone={statusTone}>{user.status || 'pending'}</StatusChip>
                          {user.riskFlags.map((flag) => (
                            <StatusChip key={flag} tone={flag === 'Spam risk' ? 'danger' : 'warning'}>{flag}</StatusChip>
                          ))}
                        </div>
                        <p className="text-sm text-[color:var(--portal-muted)] truncate mt-1">{user.displayEmail}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[color:var(--portal-muted)] mt-1.5">
                          <span>📞 {user.phone || 'N/A'}</span>
                          <span>🎓 {user.course || 'N/A'}</span>
                          <span>🕒 {user.relativeSubmitted}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          disabled={isLoadingRow}
                          onClick={() => onOpenDetail?.('Registration Detail', user)}
                          className="px-3 py-2 rounded-xl text-xs border border-cyan-200/25 bg-white/5 hover:bg-white/12 text-[color:var(--text-light)] disabled:opacity-40"
                        >
                          Detail
                        </button>
                        <button
                          type="button"
                          disabled={isLoadingRow}
                          onClick={() => runApprove(user._id, user.name)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-green-500 hover:opacity-95 disabled:opacity-40"
                        >
                          {isLoadingRow ? 'Processing...' : '✅ Approve'}
                        </button>
                        <button
                          type="button"
                          disabled={isLoadingRow}
                          onClick={() => setRejectModal({ open: true, user, reason: 'Profile does not meet requirements' })}
                          className="px-3 py-2 rounded-xl text-xs font-semibold border border-rose-300/35 text-rose-200 hover:bg-rose-500/12 disabled:opacity-40"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-xs text-[color:var(--portal-muted)]">Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredRows.length)} of {filteredRows.length}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="px-2.5 py-1.5 rounded-lg border border-cyan-200/25 bg-white/5 text-xs disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-xs text-[color:var(--portal-muted)]">Page {page} / {totalPages}</span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="px-2.5 py-1.5 rounded-lg border border-cyan-200/25 bg-white/5 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </PremiumSurface>

      <PremiumSurface title="Audit Trail" subtitle="Latest approval decisions from this session">
        {auditTrail.length ? (
          <div className="space-y-2">
            {auditTrail.slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-xl border border-cyan-200/20 bg-white/5 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-[color:var(--text-light)]">
                    <span className="font-semibold">{item.userName}</span> was {item.action}d
                  </p>
                  <StatusChip tone={item.action === 'approve' ? 'success' : 'danger'}>{item.action}</StatusChip>
                </div>
                <p className="text-xs text-[color:var(--portal-muted)] mt-1">{new Date(item.timestamp).toLocaleString()} • {item.note}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-cyan-200/20 bg-white/5 px-3 py-4 text-sm text-[color:var(--portal-muted)]">No actions yet in this session. Approvals and rejections will be logged here.</div>
        )}
      </PremiumSurface>

      {rejectModal.open && rejectModal.user ? (
        <div className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-sm flex items-center justify-center px-4" onClick={() => setRejectModal({ open: false, user: null, reason: 'Profile does not meet requirements' })}>
          <div className="w-full max-w-lg rounded-2xl border border-rose-300/35 bg-slate-950/95 p-5" onClick={(event) => event.stopPropagation()}>
            <h3 className="text-lg font-bold text-white">Confirm Rejection</h3>
            <p className="text-sm text-slate-300 mt-1">You are rejecting <span className="font-semibold text-rose-200">{rejectModal.user.name}</span>. Add a clear reason for audit compliance.</p>
            <textarea
              value={rejectModal.reason}
              onChange={(event) => setRejectModal((prev) => ({ ...prev, reason: event.target.value }))}
              rows={4}
              className="mt-3 w-full px-3 py-2 rounded-xl border border-cyan-200/25 bg-white/8 text-sm text-white placeholder-slate-400"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setRejectModal({ open: false, user: null, reason: 'Profile does not meet requirements' })} className="px-3 py-2 rounded-xl border border-cyan-200/25 bg-white/5 text-slate-100 text-sm">Cancel</button>
              <button onClick={confirmReject} className="px-3 py-2 rounded-xl text-sm font-semibold border border-rose-300/45 text-rose-100 hover:bg-rose-500/15">Confirm Reject</button>
            </div>
          </div>
        </div>
      ) : null}

      {bulkRejectModal.open ? (
        <div className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-sm flex items-center justify-center px-4" onClick={() => setBulkRejectModal({ open: false, reason: 'Bulk rejection by admin review' })}>
          <div className="w-full max-w-lg rounded-2xl border border-rose-300/35 bg-slate-950/95 p-5" onClick={(event) => event.stopPropagation()}>
            <h3 className="text-lg font-bold text-white">Bulk Reject Confirmation</h3>
            <p className="text-sm text-slate-300 mt-1">Rejecting <span className="font-semibold text-rose-200">{selectedIds.length}</span> selected registrations. Provide reason for audit logs.</p>
            <textarea
              value={bulkRejectModal.reason}
              onChange={(event) => setBulkRejectModal((prev) => ({ ...prev, reason: event.target.value }))}
              rows={4}
              className="mt-3 w-full px-3 py-2 rounded-xl border border-cyan-200/25 bg-white/8 text-sm text-white placeholder-slate-400"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setBulkRejectModal({ open: false, reason: 'Bulk rejection by admin review' })} className="px-3 py-2 rounded-xl border border-cyan-200/25 bg-white/5 text-slate-100 text-sm">Cancel</button>
              <button onClick={handleBulkReject} className="px-3 py-2 rounded-xl text-sm font-semibold border border-rose-300/45 text-rose-100 hover:bg-rose-500/15">Confirm Bulk Reject</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ApprovalsPanel({ approvals, onApprove, onOpenDetail }) {
  return (
    <TablePanel
      title="Profile Approval Queue"
      columns={['Name', 'Email', 'College', 'Status', 'Updated', 'Actions']}
      rows={approvals.map((user) => [
        user.name,
        user.email,
        user.college || '-',
        user.profile_approval_status,
        new Date(user.updated_at || user.created_at).toLocaleString(),
        <div key={user._id} className="flex gap-2 flex-wrap">
          <button className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700" onClick={() => onOpenDetail('Profile Approval Detail', user)}>Detail</button>
          <button className="text-xs px-2 py-1 rounded bg-green-100 text-green-700" onClick={() => onApprove(user._id, 'approved')}>Approve</button>
          <button className="text-xs px-2 py-1 rounded bg-red-100 text-red-700" onClick={() => onApprove(user._id, 'rejected')}>Reject</button>
          <button className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700" onClick={() => onApprove(user._id, 'needs_correction')}>Correction</button>
        </div>
      ])}
      pageSize={10}
    />
  );
}

function MatchesPanel({ matches, onOpenDetail }) {
  return <TablePanel title="Match Control" columns={['Users', 'Status', 'Matched At']} rows={matches.map((m) => [
    (m.users || []).map((u) => u.name).join(' & '),
    m.status,
    new Date(m.matchedAt || m.updatedAt).toLocaleString()
  ])} pageSize={12} onRowClick={(rowIndex) => onOpenDetail('Match Detail', matches[rowIndex])} />;
}

function ChatsPanel({ chats, moderationFilter, currentRole, onOpenDetail, visibilityMode = 'metadata' }) {
  const [selectedIds, setSelectedIds] = React.useState([]);
  const [accessRequest, setAccessRequest] = React.useState(null);
  const [auditEvents, setAuditEvents] = React.useState([]);
  const [moderationState, setModerationState] = React.useState({});
  const [reviewMessages, setReviewMessages] = React.useState([]);
  const [reviewLoading, setReviewLoading] = React.useState(false);
  const [threadViewer, setThreadViewer] = React.useState(null);
  const [moderationViewPreference, setModerationViewPreference] = React.useState('auto');
  const [workspaceOpen, setWorkspaceOpen] = React.useState(false);
  const [workspaceSelectedId, setWorkspaceSelectedId] = React.useState('');

  const backendSupportsFullView = visibilityMode === 'full';
  const isFullViewMode = backendSupportsFullView && moderationViewPreference !== 'metadata';
  const isAdminReader = currentRole === 'admin' || currentRole === 'super_admin';

  const canReviewContent = currentRole === 'super_admin' || currentRole === 'moderator' || currentRole === 'admin';

  const openMetadataDetail = (chat) => {
    const metadataOnly = {
      conversationId: chat._id,
      participants: chat.participantNames,
      messageCount: chat.messageCount,
      reportCount: chat.reportCount,
      riskScore: chat.riskScore,
      blocked: Boolean(chat.isBlocked),
      moderationStatus: chat.moderationStatus,
      suspiciousLinks: chat.suspiciousLinks,
      spamSignals: chat.spamSignals,
      lastActivity: chat.lastMessageAt || chat.updatedAt,
      privacyPolicy: 'Message bodies are restricted. Use Review action with authorized moderation reason for sensitive access.'
    };
    onOpenDetail('Conversation Safety Detail', metadataOnly);
  };

  const normalizedRows = React.useMemo(() => {
    return chats.map((chat) => {
      const messageCount = Number(chat.totalMessages || chat.messages?.length || 0);
      const reportCount = Number(chat.reportCount || chat.reportsCount || 0);
      const suspiciousLinks = Number(chat.suspiciousLinks || 0);
      const spamSignals = Number(chat.spamSignals || chat.spamCount || 0);
      const baseRisk = Math.min(100, Math.round((reportCount * 22) + (suspiciousLinks * 14) + (spamSignals * 10) + Math.min(messageCount / 8, 28)));
      const riskScore = Number(chat.riskScore || baseRisk);
      const moderationStatus = moderationState[chat._id]?.status || (riskScore >= 75 || reportCount > 0 ? 'open' : 'resolved');
      const eligibleForDeepReview = reportCount > 0 || riskScore >= 65 || suspiciousLinks > 0 || spamSignals > 1;

      return {
        ...chat,
        messageCount,
        reportCount,
        suspiciousLinks,
        spamSignals,
        riskScore,
        moderationStatus,
        eligibleForDeepReview,
        participantNames: (chat.participants || []).map((p) => p?.name || 'Unknown').join(' / ')
      };
    });
  }, [chats, moderationState]);

  const filteredRows = React.useMemo(() => {
    const baseRows = [...normalizedRows];
    if (!moderationFilter || moderationFilter === 'all') {
      return baseRows;
    }
    if (moderationFilter === 'high_risk') {
      return baseRows.filter((row) => row.riskScore >= 75);
    }
    if (moderationFilter === 'reported') {
      return baseRows.filter((row) => row.reportCount > 0);
    }
    if (moderationFilter === 'flagged') {
      return baseRows.filter((row) => row.reportCount > 0 || row.riskScore >= 70);
    }
    if (moderationFilter === 'blocked') {
      return baseRows.filter((row) => Boolean(row.isBlocked));
    }
    if (moderationFilter === 'most_messages') {
      return baseRows.sort((a, b) => b.messageCount - a.messageCount);
    }
    if (moderationFilter === 'latest_activity') {
      return baseRows.sort((a, b) => new Date(b.lastMessageAt || b.updatedAt || 0).getTime() - new Date(a.lastMessageAt || a.updatedAt || 0).getTime());
    }
    if (moderationFilter === 'under_review') {
      return baseRows.filter((row) => row.moderationStatus === 'reviewing');
    }
    if (moderationFilter === 'resolved') {
      return baseRows.filter((row) => row.moderationStatus === 'resolved');
    }
    return baseRows;
  }, [normalizedRows, moderationFilter]);

  const queueStats = React.useMemo(() => {
    return {
      harassment: filteredRows.filter((row) => row.reportCount > 0 && row.riskScore >= 70).length,
      suspiciousLinks: filteredRows.filter((row) => row.suspiciousLinks > 0).length,
      spam: filteredRows.filter((row) => row.spamSignals > 1).length,
      underReview: filteredRows.filter((row) => row.moderationStatus === 'reviewing').length,
      resolved: filteredRows.filter((row) => row.moderationStatus === 'resolved').length
    };
  }, [filteredRows]);

  const updateStatus = (chatId, status) => {
    setModerationState((prev) => ({
      ...prev,
      [chatId]: {
        ...(prev[chatId] || {}),
        status
      }
    }));
  };

  const updateNote = (chatId, notes) => {
    setModerationState((prev) => ({
      ...prev,
      [chatId]: {
        ...(prev[chatId] || {}),
        notes
      }
    }));
  };

  const toggleSelect = (chatId) => {
    setSelectedIds((prev) => (prev.includes(chatId) ? prev.filter((id) => id !== chatId) : [...prev, chatId]));
  };

  const runBulkStatusUpdate = (status) => {
    setModerationState((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        next[id] = {
          ...(next[id] || {}),
          status
        };
      });
      return next;
    });
    setSelectedIds([]);
  };

  const selectedConversation = React.useMemo(
    () => filteredRows.find((row) => selectedIds.includes(row._id)) || null,
    [filteredRows, selectedIds]
  );

  const applyEscalation = (chatId, escalation) => {
    setModerationState((prev) => ({
      ...prev,
      [chatId]: {
        ...(prev[chatId] || {}),
        escalation,
        status: escalation === 'resolve' ? 'resolved' : 'action_taken'
      }
    }));
  };

  const requestContentAccess = (chat) => {
    if (!chat.eligibleForDeepReview) {
      return;
    }
    setAccessRequest({
      chat,
      reason: '',
      notes: '',
      approved: false,
      deniedMessage: ''
    });
    setReviewMessages([]);
  };

  const buildThreadPayload = React.useCallback((chat) => {
    const participantMap = new Map((chat.participants || []).map((participant) => [String(participant?._id), participant?.name || 'Unknown']));
    const normalizedMessages = Array.isArray(chat.messages)
      ? chat.messages.map((message) => ({
          ...message,
          senderLabel: participantMap.get(String(message.senderId)) || 'User'
        }))
      : [];

    return {
      ...chat,
      participantNames: chat.participantNames,
      messages: normalizedMessages
    };
  }, []);

  const openThreadViewer = (chat) => {
    const payload = buildThreadPayload(chat);

    setThreadViewer(payload);
  };

  const activeThreadRows = React.useMemo(() => {
    return filteredRows
      .filter((row) => !row.isBlocked && row.messageCount > 0)
      .sort((a, b) => new Date(b.lastMessageAt || b.updatedAt || 0).getTime() - new Date(a.lastMessageAt || a.updatedAt || 0).getTime());
  }, [filteredRows]);

  const workspaceConversation = React.useMemo(() => {
    if (!workspaceOpen || !activeThreadRows.length) {
      return null;
    }
    const source = activeThreadRows.find((row) => row._id === workspaceSelectedId) || activeThreadRows[0];
    return source ? buildThreadPayload(source) : null;
  }, [workspaceOpen, activeThreadRows, workspaceSelectedId, buildThreadPayload]);

  React.useEffect(() => {
    if (!workspaceOpen) {
      return;
    }
    if (!activeThreadRows.length) {
      setWorkspaceSelectedId('');
      return;
    }
    if (!workspaceSelectedId || !activeThreadRows.some((row) => row._id === workspaceSelectedId)) {
      setWorkspaceSelectedId(activeThreadRows[0]._id);
    }
  }, [workspaceOpen, activeThreadRows, workspaceSelectedId]);

  const approveRequest = async () => {
    if (!accessRequest) {
      return;
    }
    if (!canReviewContent) {
      setAccessRequest((prev) => ({
        ...prev,
        deniedMessage: 'Only moderator or super admin can access sensitive conversation content.'
      }));
      return;
    }
    if (!accessRequest.reason) {
      setAccessRequest((prev) => ({
        ...prev,
        deniedMessage: 'A valid moderation reason is required for content access.'
      }));
      return;
    }

    try {
      setReviewLoading(true);
      const response = await adminApi.requestConversationReviewAccess({
        conversationId: accessRequest.chat._id,
        reason: accessRequest.reason,
        notes: accessRequest.notes
      });

      const payload = response?.data || {};
      setReviewMessages(Array.isArray(payload.messages) ? payload.messages : []);

      setAuditEvents((prev) => [
        {
          id: `${accessRequest.chat._id}-${Date.now()}`,
          conversationId: accessRequest.chat._id,
          participants: accessRequest.chat.participantNames,
          actorRole: currentRole,
          reason: accessRequest.reason,
          note: accessRequest.notes || '-',
          timestamp: new Date().toISOString()
        },
        ...prev
      ]);

      setAccessRequest((prev) => ({
        ...prev,
        approved: true,
        deniedMessage: ''
      }));
    } catch (error) {
      setAccessRequest((prev) => ({
        ...prev,
        deniedMessage: error?.message || error?.data?.message || 'Sensitive review access denied by server policy.'
      }));
    } finally {
      setReviewLoading(false);
    }
  };

  const tableRows = filteredRows.map((chat) => [
    <div key={`p-${chat._id}`} className="flex items-center gap-2">
      <input type="checkbox" checked={selectedIds.includes(chat._id)} onChange={() => toggleSelect(chat._id)} />
      <span>{chat.participantNames || '-'}</span>
    </div>,
    chat.messageCount,
    <span key={`risk-${chat._id}`} className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${chat.riskScore >= 75 ? 'bg-rose-500/20 text-rose-200 border border-rose-400/30' : chat.riskScore >= 50 ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30' : 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'}`}>{chat.riskScore}</span>,
    <span key={`report-${chat._id}`} className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${chat.reportCount > 0 ? 'bg-rose-500/20 text-rose-200 border border-rose-400/35' : 'bg-slate-500/15 text-slate-300 border border-slate-400/25'}`}>{chat.reportCount}</span>,
    <span key={`blocked-${chat._id}`} className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${chat.isBlocked ? 'bg-rose-600/25 text-rose-200 border border-rose-400/35' : 'bg-emerald-600/20 text-emerald-200 border border-emerald-400/30'}`}>{chat.isBlocked ? 'Blocked' : 'Active'}</span>,
    new Date(chat.lastMessageAt || chat.updatedAt || Date.now()).toLocaleString(),
    <select key={`status-${chat._id}`} value={chat.moderationStatus} onChange={(event) => updateStatus(chat._id, event.target.value)} className="px-2 py-1 rounded-lg bg-slate-800 border border-white/15 text-xs">
      <option value="open">Open</option>
      <option value="reviewing">Reviewing</option>
      <option value="action_taken">Action Taken</option>
      <option value="resolved">Resolved</option>
    </select>,
    <div key={`act-${chat._id}`} className="flex gap-1.5">
      <button className="text-xs px-2 py-1 rounded-lg bg-white/10 border border-white/20" onClick={() => openMetadataDetail(chat)}>Detail</button>
      {isFullViewMode ? (
        <button className="text-xs px-2 py-1 rounded-lg bg-cyan-500/20 border border-cyan-300/35 text-cyan-100" onClick={() => openThreadViewer(chat)}>
          Read Chat
        </button>
      ) : (
        <button className={`text-xs px-2 py-1 rounded-lg ${chat.eligibleForDeepReview ? 'bg-fuchsia-500/25 border border-fuchsia-300/35 text-fuchsia-100' : 'bg-white/5 border border-white/10 text-slate-400 cursor-not-allowed'}`} disabled={!chat.eligibleForDeepReview} onClick={() => requestContentAccess(chat)}>
          Request Access
        </button>
      )}
    </div>
  ]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-cyan-300/20 bg-gradient-to-r from-cyan-500/12 via-sky-500/8 to-transparent px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/70">Trust and Safety Ops</p>
            <p className="text-sm text-slate-200">Investigate conversation risks, escalate incidents, and audit moderator access from one workspace.</p>
          </div>
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${isFullViewMode ? 'border-cyan-300/35 bg-cyan-500/20 text-cyan-100' : 'border-amber-300/35 bg-amber-500/15 text-amber-100'}`}>
            Mode: {isFullViewMode ? 'Full Chat Visibility' : 'Metadata Protected'}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-cyan-200/15 bg-[#0a1a36]/58 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-slate-300">Visibility Controls</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setModerationViewPreference('auto')}
            className={`px-3 py-1.5 text-xs rounded-lg border ${moderationViewPreference === 'auto' ? 'border-cyan-300/40 bg-cyan-500/20 text-cyan-100' : 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'}`}
          >
            Auto
          </button>
          <button
            type="button"
            onClick={() => setModerationViewPreference('metadata')}
            className={`px-3 py-1.5 text-xs rounded-lg border ${moderationViewPreference === 'metadata' ? 'border-amber-300/40 bg-amber-500/20 text-amber-100' : 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'}`}
          >
            Metadata
          </button>
          <button
            type="button"
            onClick={() => setModerationViewPreference('full')}
            disabled={!backendSupportsFullView}
            className={`px-3 py-1.5 text-xs rounded-lg border ${moderationViewPreference === 'full' && backendSupportsFullView ? 'border-cyan-300/45 bg-cyan-500/20 text-cyan-100' : 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'} disabled:opacity-40`}
          >
            Full
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        {isFullViewMode
          ? 'Admin full visibility active: you can open complete conversation threads between users for moderation, compliance, and safety review.'
          : moderationViewPreference === 'metadata' && backendSupportsFullView
            ? 'Metadata mode was selected manually. Switch to Full to read all messages.'
          : isAdminReader
            ? 'Full chat visibility is not enabled by server policy. Admin is currently in metadata mode only.'
            : 'Privacy notice: full conversation content is hidden by default. Access is allowed only for flagged/reported conversations with authorized role and auditable reason.'}
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <MetricCard label="Harassment Flags" value={queueStats.harassment} tone="rose" />
        <MetricCard label="Suspicious Links" value={queueStats.suspiciousLinks} tone="amber" />
        <MetricCard label="Repeated Spam" value={queueStats.spam} tone="orange" />
        <MetricCard label="Under Review" value={queueStats.underReview} tone="cyan" />
        <MetricCard label="Resolved Cases" value={queueStats.resolved} tone="emerald" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cyan-200/15 bg-[#0a1a36]/58 px-4 py-3">
        <div className="text-sm text-slate-300">Bulk actions for selected conversations ({selectedIds.length})</div>
        <div className="flex gap-2">
          <button disabled={!selectedIds.length} onClick={() => runBulkStatusUpdate('reviewing')} className="px-3 py-1.5 text-xs rounded-lg bg-cyan-500/20 border border-cyan-300/30 disabled:opacity-40">Mark Reviewing</button>
          <button disabled={!selectedIds.length} onClick={() => runBulkStatusUpdate('action_taken')} className="px-3 py-1.5 text-xs rounded-lg bg-amber-500/20 border border-amber-300/30 disabled:opacity-40">Action Taken</button>
          <button disabled={!selectedIds.length} onClick={() => runBulkStatusUpdate('resolved')} className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500/20 border border-emerald-300/30 disabled:opacity-40">Resolve</button>
        </div>
      </div>

      <TablePanel
        title={isFullViewMode ? 'Conversation Safety Queue (Full Thread Access)' : 'Conversation Safety Queue'}
        columns={['Participants', 'Messages', 'Risk', 'Reports', 'Blocked', 'Last Activity', 'Case Status', 'Actions']}
        rows={tableRows}
        pageSize={12}
      />

      {isFullViewMode ? (
        <div className="rounded-2xl border border-cyan-200/15 bg-[#0a1a36]/58 p-4 md:p-5 shadow-[0_18px_45px_rgba(2,12,27,0.28)]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-white">Active Threads Workspace</h3>
              <p className="text-xs text-cyan-100/75 mt-1">Review live conversations quickly in a split workspace.</p>
            </div>
            <button
              type="button"
              onClick={() => setWorkspaceOpen((prev) => !prev)}
              className="px-3 py-1.5 rounded-lg border border-cyan-300/35 bg-cyan-500/20 text-cyan-100 text-xs font-semibold hover:bg-cyan-500/30"
            >
              {workspaceOpen ? 'Hide Workspace' : 'Open Active Threads'}
            </button>
          </div>

          {workspaceOpen ? (
            activeThreadRows.length ? (
              <div className="grid xl:grid-cols-[320px_1fr] gap-3">
                <div className="rounded-xl border border-cyan-200/15 bg-black/20 p-2.5 max-h-[52vh] overflow-auto space-y-2">
                  {activeThreadRows.slice(0, 50).map((row) => (
                    <button
                      key={`workspace-${row._id}`}
                      type="button"
                      onClick={() => setWorkspaceSelectedId(row._id)}
                      className={`w-full text-left rounded-lg border px-2.5 py-2 transition ${workspaceConversation?._id === row._id ? 'border-cyan-300/40 bg-cyan-500/20' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                    >
                      <p className="text-sm font-semibold text-slate-100 truncate">{row.participantNames}</p>
                      <p className="text-xs text-slate-400 mt-1">Messages: {row.messageCount} • Reports: {row.reportCount}</p>
                    </button>
                  ))}
                </div>

                <div className="rounded-xl border border-cyan-200/15 bg-black/20 p-3">
                  {workspaceConversation ? (
                    <>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{workspaceConversation.participantNames}</p>
                          <p className="text-xs text-slate-400 mt-1">Conversation ID: {workspaceConversation._id}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openThreadViewer(workspaceConversation)}
                          className="px-2.5 py-1.5 rounded-lg border border-cyan-300/35 bg-cyan-500/20 text-cyan-100 text-xs"
                        >
                          Popout Reader
                        </button>
                      </div>
                      <div className="max-h-[42vh] overflow-auto space-y-2">
                        {Array.isArray(workspaceConversation.messages) && workspaceConversation.messages.length ? workspaceConversation.messages.map((message) => (
                          <div key={message._id || `${message.senderId}-${message.createdAt}`} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
                            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                              <span>{message.senderLabel || 'User'}</span>
                              <span>{new Date(message.createdAt || Date.now()).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-slate-100 break-words whitespace-pre-wrap">{message.text || '[non-text payload]'}</p>
                          </div>
                        )) : <p className="text-sm text-slate-400">No message payloads available.</p>}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400">Select a thread from the left panel.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-cyan-200/15 bg-white/5 px-4 py-8 text-center text-slate-300 text-sm">
                No active threads found for workspace review.
              </div>
            )
          ) : null}
        </div>
      ) : null}

      {selectedConversation ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="font-semibold text-white">Moderation Workbench: {selectedConversation.participantNames}</p>
            <span className="text-xs px-2.5 py-1 rounded-full border border-white/15 bg-white/5 text-slate-300">Case: {selectedConversation.moderationStatus}</span>
          </div>

          <textarea
            value={moderationState[selectedConversation._id]?.notes || ''}
            onChange={(event) => updateNote(selectedConversation._id, event.target.value)}
            placeholder="Moderator notes, evidence summary, or escalation context..."
            rows="3"
            className="w-full mb-3 px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-slate-100 placeholder-slate-500"
          />

          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-1.5 text-xs rounded-lg bg-amber-500/20 border border-amber-300/30" onClick={() => applyEscalation(selectedConversation._id, 'warn_user')}>Escalate: Warn User</button>
            <button className="px-3 py-1.5 text-xs rounded-lg bg-rose-500/20 border border-rose-300/30" onClick={() => applyEscalation(selectedConversation._id, 'freeze_chat')}>Escalate: Freeze Chat</button>
            <button className="px-3 py-1.5 text-xs rounded-lg bg-cyan-500/20 border border-cyan-300/30" onClick={() => applyEscalation(selectedConversation._id, 'trust_safety_review')}>Escalate: Trust & Safety</button>
            <button className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500/20 border border-emerald-300/30" onClick={() => applyEscalation(selectedConversation._id, 'resolve')}>Mark Resolved</button>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-4">
        <p className="font-semibold text-white mb-3">Access Audit Trail</p>
        {auditEvents.length ? (
          <div className="space-y-2 max-h-64 overflow-auto">
            {auditEvents.map((eventItem) => (
              <div key={eventItem.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
                <p><span className="text-slate-400">Conversation:</span> {eventItem.participants}</p>
                <p><span className="text-slate-400">Role:</span> {eventItem.actorRole} · <span className="text-slate-400">Reason:</span> {eventItem.reason}</p>
                <p><span className="text-slate-400">Note:</span> {eventItem.note}</p>
                <p className="text-slate-500 mt-1">{new Date(eventItem.timestamp).toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No sensitive conversation access events recorded in this session.</p>
        )}
      </div>

      {accessRequest ? (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setAccessRequest(null)}>
          <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-slate-900 p-5" onClick={(event) => event.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-2">Conversation Review Authorization</h3>
            <p className="text-sm text-slate-300 mb-4">Participants: {accessRequest.chat.participantNames}</p>

            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">Risk Score: <span className="font-semibold text-white">{accessRequest.chat.riskScore}</span></div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">Reports: <span className="font-semibold text-white">{accessRequest.chat.reportCount}</span></div>
            </div>

            <select value={accessRequest.reason} onChange={(event) => setAccessRequest((prev) => ({ ...prev, reason: event.target.value }))} className="w-full mb-3 px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-sm">
              <option value="">Select moderation reason</option>
              <option value="user_report">User report investigation</option>
              <option value="abuse_signal">Abusive content signal</option>
              <option value="fraud_alert">Fraud/scam review</option>
              <option value="legal_request">Legal compliance request</option>
            </select>

            <textarea value={accessRequest.notes} onChange={(event) => setAccessRequest((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Moderator notes / evidence context" rows="3" className="w-full mb-3 px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-sm" />

            {accessRequest.deniedMessage ? <p className="text-xs text-rose-300 mb-3">{accessRequest.deniedMessage}</p> : null}

            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 rounded-xl border border-white/20 bg-white/5 text-sm" onClick={() => setAccessRequest(null)}>Cancel</button>
              <button disabled={reviewLoading} className="px-3 py-2 rounded-xl bg-fuchsia-500/80 hover:bg-fuchsia-500 text-sm font-semibold disabled:opacity-60" onClick={approveRequest}>{reviewLoading ? 'Authorizing...' : 'Authorize Access'}</button>
            </div>

            {accessRequest.approved ? (
              <div className="mt-4 rounded-xl border border-emerald-400/35 bg-emerald-500/10 p-3">
                <p className="text-sm text-emerald-200 mb-2">Authorized. Audit log entry recorded.</p>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-slate-300 max-h-40 overflow-auto">
                  {reviewMessages.length ? reviewMessages.slice(-15).map((msg, idx) => (
                    <p key={idx} className="mb-1">• {msg?.text || '[redacted message payload]'}</p>
                  )) : 'No message bodies returned by API. Metadata-only mode remains active.'}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {threadViewer ? (
        <div className="fixed inset-0 z-50 bg-black/65" onClick={() => setThreadViewer(null)}>
          <div className="absolute right-0 top-0 h-full w-full max-w-2xl border-l border-white/15 bg-slate-950/95 backdrop-blur-xl p-5" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Conversation Thread Viewer</p>
                <h3 className="text-lg font-bold text-white mt-1">{threadViewer.participantNames}</h3>
                <p className="text-xs text-slate-400 mt-1">Conversation ID: {threadViewer._id}</p>
              </div>
              <button className="px-3 py-1.5 rounded-lg border border-white/20 bg-white/5 text-sm text-slate-200" onClick={() => setThreadViewer(null)}>Close</button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-slate-300">Messages: <span className="font-semibold text-white">{threadViewer.messageCount || threadViewer.totalMessages || 0}</span></div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-slate-300">Reports: <span className="font-semibold text-white">{threadViewer.reportCount || 0}</span></div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-slate-300">Last Activity: <span className="font-semibold text-white">{new Date(threadViewer.lastMessageAt || threadViewer.updatedAt || Date.now()).toLocaleString()}</span></div>
            </div>

            <div className="h-[calc(100%-165px)] overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
              {Array.isArray(threadViewer.messages) && threadViewer.messages.length ? threadViewer.messages.map((message) => (
                <div key={message._id || `${message.senderId}-${message.createdAt}`} className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 mb-1">
                    <span>{message.senderLabel || 'User'}</span>
                    <span>{new Date(message.createdAt || Date.now()).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-100 break-words whitespace-pre-wrap">{message.text || '[non-text payload]'}</p>
                </div>
              )) : (
                <p className="text-sm text-slate-400">No message payloads available for this conversation.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PaymentsPanel({ payments, summary, onOpenDetail, onRefresh, onUpdateSetting, settings = [], adminPin = '', onNotify }) {
  const API_BASE_URL = getApiBaseUrl();
  const API_ROOT = String(API_BASE_URL || '').replace(/\/api$/i, '');
  const billingSetting = settings.find((item) => item.key === 'billing_config');
  const billingValue = billingSetting?.value || {};
  const [billingDraft, setBillingDraft] = React.useState({
    premiumPrice: Number(billingValue.premiumPrice || billingValue.monthlyPrice) || 99,
    maxMessagesPerDay: Number(billingValue.maxMessagesPerDay) || 50,
    maxActiveMatches: Number(billingValue.maxActiveMatches) || 1,
    maxRequestsPerDay: Number(billingValue.maxRequestsPerDay) || 5,
    premiumFree: Boolean(billingValue.premiumFree),
    disableFreeMode: Boolean(billingValue.disableFreeMode),
    upiEnabled: billingValue.upiEnabled !== false,
    qrEnabled: billingValue.qrEnabled !== false,
    couponsEnabled: billingValue.couponsEnabled !== false,
    bankEnabled: billingValue.bankEnabled !== false,
    upiId: billingValue.upiId || '',
    accountHolder: billingValue.accountHolder || '',
    bankName: billingValue.bankName || '',
    accountNumber: billingValue.accountNumber || '',
    ifscCode: billingValue.ifscCode || '',
    offerText: billingValue.offerText || '',
    paymentInstructions: billingValue.paymentInstructions || '',
    couponCode: billingValue.couponCode || '',
    couponDiscountPct: Number(billingValue.couponDiscountPct) || 0
  });
  const [membershipAction, setMembershipAction] = React.useState({
    userId: '',
    action: 'grant',
    plan: 'Premium',
    durationDays: 30,
    amount: 0,
    note: ''
  });
  const [savingConfig, setSavingConfig] = React.useState(false);
  const [runningMembershipAction, setRunningMembershipAction] = React.useState(false);

  React.useEffect(() => {
    setBillingDraft((prev) => ({
      ...prev,
      premiumPrice: Number(billingValue.premiumPrice || billingValue.monthlyPrice) || prev.premiumPrice,
      maxMessagesPerDay: Number(billingValue.maxMessagesPerDay) || prev.maxMessagesPerDay,
      maxActiveMatches: Number(billingValue.maxActiveMatches) || prev.maxActiveMatches,
      maxRequestsPerDay: Number(billingValue.maxRequestsPerDay) || prev.maxRequestsPerDay,
      premiumFree: typeof billingValue.premiumFree === 'boolean' ? billingValue.premiumFree : prev.premiumFree,
      disableFreeMode: typeof billingValue.disableFreeMode === 'boolean' ? billingValue.disableFreeMode : prev.disableFreeMode,
      upiEnabled: billingValue.upiEnabled !== false,
      qrEnabled: billingValue.qrEnabled !== false,
      couponsEnabled: billingValue.couponsEnabled !== false,
      bankEnabled: billingValue.bankEnabled !== false,
      upiId: billingValue.upiId || prev.upiId,
      accountHolder: billingValue.accountHolder || prev.accountHolder,
      bankName: billingValue.bankName || prev.bankName,
      accountNumber: billingValue.accountNumber || prev.accountNumber,
      ifscCode: billingValue.ifscCode || prev.ifscCode,
      offerText: billingValue.offerText || prev.offerText,
      paymentInstructions: billingValue.paymentInstructions || prev.paymentInstructions,
      couponCode: billingValue.couponCode || '',
      couponDiscountPct: Number(billingValue.couponDiscountPct) || 0
    }));
  }, [billingValue.accountHolder, billingValue.accountNumber, billingValue.bankEnabled, billingValue.bankName, billingValue.couponCode, billingValue.couponDiscountPct, billingValue.couponsEnabled, billingValue.disableFreeMode, billingValue.ifscCode, billingValue.maxActiveMatches, billingValue.maxMessagesPerDay, billingValue.maxRequestsPerDay, billingValue.monthlyPrice, billingValue.offerText, billingValue.paymentInstructions, billingValue.premiumFree, billingValue.premiumPrice, billingValue.qrEnabled, billingValue.upiEnabled, billingValue.upiId]);

  const persistBillingConfig = async () => {
    setSavingConfig(true);
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const premiumPrice = Number(billingDraft.premiumPrice) || 99;
      const maxMessagesPerDay = Math.max(1, Number(billingDraft.maxMessagesPerDay) || 50);
      const maxActiveMatches = Math.max(1, Number(billingDraft.maxActiveMatches) || 1);
      const maxRequestsPerDay = Math.max(1, Number(billingDraft.maxRequestsPerDay) || 5);

      await onUpdateSetting?.('billing_config', {
        premiumPrice,
        monthlyPrice: premiumPrice,
        goldPrice: premiumPrice,
        platinumPrice: premiumPrice,
        maxMessagesPerDay,
        maxActiveMatches,
        maxRequestsPerDay,
        premiumFree: Boolean(billingDraft.premiumFree),
        disableFreeMode: Boolean(billingDraft.disableFreeMode),
        upiEnabled: Boolean(billingDraft.upiEnabled),
        qrEnabled: Boolean(billingDraft.qrEnabled),
        couponsEnabled: Boolean(billingDraft.couponsEnabled),
        bankEnabled: Boolean(billingDraft.bankEnabled),
        upiId: String(billingDraft.upiId || '').trim(),
        accountHolder: String(billingDraft.accountHolder || '').trim(),
        bankName: String(billingDraft.bankName || '').trim(),
        accountNumber: String(billingDraft.accountNumber || '').trim(),
        ifscCode: String(billingDraft.ifscCode || '').trim(),
        offerText: String(billingDraft.offerText || '').trim(),
        paymentInstructions: String(billingDraft.paymentInstructions || '').trim(),
        couponCode: String(billingDraft.couponCode || '').trim().toUpperCase(),
        couponDiscountPct: Math.max(0, Math.min(95, Number(billingDraft.couponDiscountPct) || 0))
      });

      await Promise.all([
        fetch(`${API_ROOT}/api/config/admin/update-price`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ planId: 'premium', newPrice: premiumPrice })
        }),
        fetch(`${API_ROOT}/api/config/admin/update-limit`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ featureKey: 'messaging', plan: 'free', limitKey: 'maxMessagesPerDay', value: maxMessagesPerDay })
        }),
        fetch(`${API_ROOT}/api/config/admin/update-limit`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ featureKey: 'messaging', plan: 'free', limitKey: 'maxActiveMatches', value: maxActiveMatches })
        }),
        fetch(`${API_ROOT}/api/config/admin/update-limit`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ featureKey: 'requests', plan: 'free', limitKey: 'maxRequestsPerDay', value: maxRequestsPerDay })
        }),
        fetch(`${API_ROOT}/api/config/admin/global-override`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            premiumFree: Boolean(billingDraft.premiumFree),
            disableFreeMode: Boolean(billingDraft.disableFreeMode)
          })
        }),
        fetch(`${API_ROOT}/api/config/admin/payment-config`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            upiId: String(billingDraft.upiId || '').trim(),
            offerText: String(billingDraft.offerText || '').trim(),
            accountHolder: String(billingDraft.accountHolder || '').trim(),
            bankName: String(billingDraft.bankName || '').trim(),
            accountNumber: String(billingDraft.accountNumber || '').trim(),
            ifscCode: String(billingDraft.ifscCode || '').trim(),
            paymentInstructions: String(billingDraft.paymentInstructions || '').trim(),
            bankEnabled: Boolean(billingDraft.bankEnabled),
            upiEnabled: Boolean(billingDraft.upiEnabled),
            qrEnabled: Boolean(billingDraft.qrEnabled),
            enabled: Boolean(billingDraft.upiEnabled || billingDraft.qrEnabled)
          })
        })
      ]);

      onNotify?.('Pricing controls saved and synced to live 2-tier config.');
    } catch (err) {
      onNotify?.(err?.message || 'Failed to save billing config', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const runMembershipAction = async () => {
    if (!membershipAction.userId.trim()) {
      onNotify?.('User ID is required for membership action', 'error');
      return;
    }

    if (!window.confirm(`Confirm membership action: ${membershipAction.action} for user ${membershipAction.userId}?`)) {
      return;
    }

    setRunningMembershipAction(true);
    try {
      await adminApi.applyMembershipAction({
        userId: membershipAction.userId.trim(),
        action: membershipAction.action,
        plan: membershipAction.plan === 'Premium' ? 'CU Crush+' : membershipAction.plan,
        durationDays: Number(membershipAction.durationDays) || 30,
        amount: Number(membershipAction.amount) || 0,
        note: membershipAction.note
      }, adminPin);

      onNotify?.(`Membership ${membershipAction.action} applied successfully.`);
      setMembershipAction((prev) => ({ ...prev, userId: '', note: '' }));
      await onRefresh?.({ silent: false });
    } catch (err) {
      onNotify?.(err?.response?.data?.message || err?.message || 'Failed to apply membership action', 'error');
    } finally {
      setRunningMembershipAction(false);
    }
  };

  const handlePaymentAction = async (paymentId, action) => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
      if (!token) {
        onNotify?.('Admin not authenticated', 'error');
        return;
      }

      let rejectionReason = '';
      if (action === 'reject') {
        rejectionReason = window.prompt('Enter rejection reason:', 'Payment proof is not valid') || '';
        if (!rejectionReason) {
          return;
        }
      }

      // Call the correct endpoint
      const endpoint = action === 'approve'
        ? `${API_ROOT}/api/admin/subscriptions/${paymentId}/approve`
        : `${API_ROOT}/api/admin/subscriptions/${paymentId}/reject`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...(adminPin ? { 'x-admin-pin': adminPin } : {})
        },
        body: JSON.stringify({ 
          adminNotes: '',
          rejectionReason: rejectionReason || undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        onNotify?.(`Payment ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
        await onRefresh?.({ silent: false });
      } else {
        onNotify?.(`Failed to ${action} payment: ${data.message || 'Unknown error'}`, 'error');
      }
    } catch (err) {
      console.error('Error:', err);
      onNotify?.(`Error updating payment: ${err.message}`, 'error');
    }
  };

  const exportPayments = () => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('authToken');
    if (!token) {
      onNotify?.('Admin not authenticated', 'error');
      return;
    }

    if (!payments || payments.length === 0) {
      onNotify?.('No payment data to export', 'error');
      return;
    }

    try {
      // Prepare export data
      const exportData = payments.map(p => ({
        'Payment ID': p._id || '',
        'User Name': p.user_id?.name || 'Unknown',
        'User Email': p.user_id?.email || '',
        'Plan': p.plan || '',
        'Amount (₹)': p.amount || 0,
        'Status': p.status || 'pending',
        'Payment Proof': p.paymentProof ? 'Yes' : 'No',
        'Submitted Date': p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
        'Updated Date': p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : ''
      }));

      // Export to CSV
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(h => {
            const val = row[h];
            if (val === null || val === undefined) return '';
            const str = String(val);
            return str.includes(',') || str.includes('"') || str.includes('\n') 
              ? `"${str.replace(/"/g, '""')}"` 
              : str;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `payments_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      onNotify?.('Failed to export payments', 'error');
    }
  };

  // Separate pending and approved payments
  const pendingPayments = payments?.filter((p) => String(p.status || '').toLowerCase() === 'pending') || [];
  const approvedPayments = payments?.filter((p) => ['approved', 'active'].includes(String(p.status || '').toLowerCase())) || [];
  const rejectedPayments = payments?.filter((p) => ['rejected', 'failed'].includes(String(p.status || '').toLowerCase())) || [];

  const totalPayments = summary?.totalPayments || payments.length;
  const totalRevenue = Number(summary?.totalRevenue || 0);
  const approvalRate = totalPayments ? Math.round(((summary?.approvedPayments || approvedPayments.length) / totalPayments) * 100) : 0;
  const pendingAmount = pendingPayments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const inputClass = 'mt-1 w-full rounded-xl bg-white/8 border border-cyan-200/20 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/40';

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cyan-300/20 bg-gradient-to-r from-cyan-500/12 via-sky-500/8 to-transparent px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/70">Revenue Ops Command Center</p>
            <p className="text-sm text-slate-200">Manage pricing, process payment proofs, and apply membership actions with audit visibility.</p>
          </div>
          <button
            onClick={exportPayments}
            className="px-4 py-2 rounded-xl border border-cyan-300/40 bg-cyan-500/20 text-cyan-100 text-sm font-semibold hover:bg-cyan-500/30 transition"
          >
            Export Payments CSV
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-3">
        <MetricCard label="Total Revenue" value={`Rs ${totalRevenue}`} />
        <MetricCard label="All Payments" value={totalPayments} />
        <MetricCard label="Approved" value={summary?.approvedPayments || approvedPayments.length} />
        <MetricCard label="Approval Rate" value={`${approvalRate}%`} />
        <MetricCard label="Pending Value" value={`Rs ${pendingAmount}`} />
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-cyan-200/15 bg-[#0a1a36]/58 p-4 md:p-5 shadow-[0_18px_50px_rgba(2,12,27,0.28)]">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Pricing and Billing Controls</h3>
            <button onClick={persistBillingConfig} disabled={savingConfig} className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-500 transition disabled:opacity-60">
              {savingConfig ? 'Saving...' : 'Save Controls'}
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <label className="text-xs text-slate-300">Premium Price (INR)
              <input type="number" value={billingDraft.premiumPrice} onChange={(event) => setBillingDraft((prev) => ({ ...prev, premiumPrice: event.target.value }))} className={inputClass} />
            </label>
            <label className="text-xs text-slate-300">Free Plan Price
              <input type="number" value={0} disabled className={`${inputClass} opacity-65`} />
            </label>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mb-3">
            <label className="text-xs text-slate-300">Free messages/day
              <input type="number" value={billingDraft.maxMessagesPerDay} onChange={(event) => setBillingDraft((prev) => ({ ...prev, maxMessagesPerDay: event.target.value }))} className={inputClass} />
            </label>
            <label className="text-xs text-slate-300">Free active matches
              <input type="number" value={billingDraft.maxActiveMatches} onChange={(event) => setBillingDraft((prev) => ({ ...prev, maxActiveMatches: event.target.value }))} className={inputClass} />
            </label>
            <label className="text-xs text-slate-300">Free requests/day
              <input type="number" value={billingDraft.maxRequestsPerDay} onChange={(event) => setBillingDraft((prev) => ({ ...prev, maxRequestsPerDay: event.target.value }))} className={inputClass} />
            </label>
          </div>

          <div className="grid sm:grid-cols-4 gap-3 mb-3">
            <label className="text-xs text-slate-300 flex items-center gap-2 rounded-lg border border-cyan-300/15 bg-white/5 px-2.5 py-2"><input type="checkbox" checked={billingDraft.upiEnabled} onChange={(event) => setBillingDraft((prev) => ({ ...prev, upiEnabled: event.target.checked }))} />UPI enabled</label>
            <label className="text-xs text-slate-300 flex items-center gap-2 rounded-lg border border-cyan-300/15 bg-white/5 px-2.5 py-2"><input type="checkbox" checked={billingDraft.qrEnabled} onChange={(event) => setBillingDraft((prev) => ({ ...prev, qrEnabled: event.target.checked }))} />QR enabled</label>
            <label className="text-xs text-slate-300 flex items-center gap-2 rounded-lg border border-cyan-300/15 bg-white/5 px-2.5 py-2"><input type="checkbox" checked={billingDraft.couponsEnabled} onChange={(event) => setBillingDraft((prev) => ({ ...prev, couponsEnabled: event.target.checked }))} />Coupons enabled</label>
            <label className="text-xs text-slate-300 flex items-center gap-2 rounded-lg border border-cyan-300/15 bg-white/5 px-2.5 py-2"><input type="checkbox" checked={billingDraft.bankEnabled} onChange={(event) => setBillingDraft((prev) => ({ ...prev, bankEnabled: event.target.checked }))} />Bank transfer enabled</label>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <label className="text-xs text-slate-300 flex items-center gap-2 rounded-lg border border-cyan-300/15 bg-white/5 px-2.5 py-2"><input type="checkbox" checked={billingDraft.premiumFree} onChange={(event) => setBillingDraft((prev) => ({ ...prev, premiumFree: event.target.checked }))} />Premium for everyone</label>
            <label className="text-xs text-slate-300 flex items-center gap-2 rounded-lg border border-cyan-300/15 bg-white/5 px-2.5 py-2"><input type="checkbox" checked={billingDraft.disableFreeMode} onChange={(event) => setBillingDraft((prev) => ({ ...prev, disableFreeMode: event.target.checked }))} />Disable free mode</label>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <label className="text-xs text-slate-300">UPI ID
              <input value={billingDraft.upiId} onChange={(event) => setBillingDraft((prev) => ({ ...prev, upiId: event.target.value }))} placeholder="name@bank" className={inputClass} />
            </label>
            <label className="text-xs text-slate-300">Offer text
              <input value={billingDraft.offerText} onChange={(event) => setBillingDraft((prev) => ({ ...prev, offerText: event.target.value }))} placeholder="Limited time offer" className={inputClass} />
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <label className="text-xs text-slate-300">Account holder
              <input value={billingDraft.accountHolder} onChange={(event) => setBillingDraft((prev) => ({ ...prev, accountHolder: event.target.value }))} placeholder="CU Daters Pvt Ltd" className={inputClass} />
            </label>
            <label className="text-xs text-slate-300">Bank name
              <input value={billingDraft.bankName} onChange={(event) => setBillingDraft((prev) => ({ ...prev, bankName: event.target.value }))} placeholder="HDFC Bank" className={inputClass} />
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <label className="text-xs text-slate-300">Account number
              <input value={billingDraft.accountNumber} onChange={(event) => setBillingDraft((prev) => ({ ...prev, accountNumber: event.target.value }))} placeholder="1234567890123" className={inputClass} />
            </label>
            <label className="text-xs text-slate-300">IFSC code
              <input value={billingDraft.ifscCode} onChange={(event) => setBillingDraft((prev) => ({ ...prev, ifscCode: event.target.value.toUpperCase() }))} placeholder="HDFC0005678" className={inputClass} />
            </label>
          </div>

          <label className="text-xs text-slate-300 block mb-3">Payment instructions
            <textarea value={billingDraft.paymentInstructions} onChange={(event) => setBillingDraft((prev) => ({ ...prev, paymentInstructions: event.target.value }))} placeholder="Important instruction shown to users during checkout" rows={2} className={inputClass} />
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs text-slate-300">Coupon code
              <input value={billingDraft.couponCode} onChange={(event) => setBillingDraft((prev) => ({ ...prev, couponCode: event.target.value }))} placeholder="WELCOME20" className={inputClass} />
            </label>
            <label className="text-xs text-slate-300">Discount %
              <input type="number" min="0" max="95" value={billingDraft.couponDiscountPct} onChange={(event) => setBillingDraft((prev) => ({ ...prev, couponDiscountPct: event.target.value }))} className={inputClass} />
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-200/15 bg-[#0a1a36]/58 p-4 md:p-5 shadow-[0_18px_50px_rgba(2,12,27,0.28)]">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-4">Membership Operations</h3>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <input value={membershipAction.userId} onChange={(event) => setMembershipAction((prev) => ({ ...prev, userId: event.target.value }))} placeholder="User ID" className={inputClass.replace('mt-1 ', '')} />
            <select value={membershipAction.action} onChange={(event) => setMembershipAction((prev) => ({ ...prev, action: event.target.value }))} className={inputClass.replace('mt-1 ', '')}>
              <option value="grant">Grant</option>
              <option value="extend">Extend</option>
              <option value="revoke">Revoke</option>
            </select>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 mb-3">
            <select value={membershipAction.plan} onChange={(event) => setMembershipAction((prev) => ({ ...prev, plan: event.target.value }))} className={inputClass.replace('mt-1 ', '')}>
              <option value="Premium">Premium</option>
            </select>
            <input type="number" value={membershipAction.durationDays} onChange={(event) => setMembershipAction((prev) => ({ ...prev, durationDays: event.target.value }))} placeholder="Days" className={inputClass.replace('mt-1 ', '')} />
            <input type="number" value={membershipAction.amount} onChange={(event) => setMembershipAction((prev) => ({ ...prev, amount: event.target.value }))} placeholder="Amount" className={inputClass.replace('mt-1 ', '')} />
          </div>
          <textarea value={membershipAction.note} onChange={(event) => setMembershipAction((prev) => ({ ...prev, note: event.target.value }))} placeholder="Audit note (optional)" rows={3} className={`${inputClass.replace('mt-1 ', '')} mb-3`} />
          <button onClick={runMembershipAction} disabled={runningMembershipAction} className="w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-900/35 hover:brightness-110 transition disabled:opacity-60">
            {runningMembershipAction ? 'Applying...' : 'Apply Membership Action'}
          </button>
        </div>
      </div>

      {pendingPayments.length > 0 ? (
        <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-base font-bold text-amber-100">Pending Approvals ({pendingPayments.length})</h3>
            <p className="text-xs text-amber-100/80">These payments are waiting for finance action.</p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-amber-200/20">
            <table className="w-full text-sm">
              <thead className="bg-amber-400/10 text-amber-100 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left py-2.5 px-3">User</th>
                  <th className="text-left py-2.5 px-3">Plan</th>
                  <th className="text-left py-2.5 px-3">Amount</th>
                  <th className="text-left py-2.5 px-3">Payment ID</th>
                  <th className="text-left py-2.5 px-3">Submitted</th>
                  <th className="text-left py-2.5 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.map((payment) => (
                  <tr key={payment._id} className="border-t border-amber-200/15 hover:bg-amber-400/10 transition-colors">
                    <td className="py-3 px-3 text-slate-100">{payment.user_id?.name || payment.userName || '-'}</td>
                    <td className="py-3 px-3 font-semibold text-fuchsia-200">{payment.plan || payment.planName}</td>
                    <td className="py-3 px-3 font-bold text-white">Rs {payment.amount}</td>
                    <td className="py-3 px-3"><span className="inline-flex rounded-md bg-black/25 border border-white/10 px-2 py-0.5 font-mono text-[11px] text-slate-200">{payment.payment_id || payment.paymentId || '-'}</span></td>
                    <td className="py-3 px-3 text-xs text-slate-300">{new Date(payment.created_at || payment.createdAt).toLocaleString()}</td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => handlePaymentAction(payment._id, 'approve')} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-400 transition font-semibold">Approve</button>
                        <button onClick={() => handlePaymentAction(payment._id, 'reject')} className="text-xs px-3 py-1.5 rounded-lg bg-rose-500 text-white hover:bg-rose-400 transition font-semibold">Reject</button>
                        <button onClick={() => onOpenDetail('Payment Detail', payment)} className="text-xs px-3 py-1.5 rounded-lg border border-cyan-300/35 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30 transition font-semibold">View</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="grid lg:grid-cols-2 gap-4">
        {approvedPayments.length > 0 ? (
          <div className="rounded-2xl border border-emerald-300/25 bg-emerald-500/10 p-4 md:p-5">
            <h3 className="text-base font-bold text-emerald-100 mb-3">Approved ({approvedPayments.length})</h3>
            <TablePanel
              columnClassName="text-xs"
              columns={['User', 'Plan', 'Amount', 'Payment ID', 'Approved At']}
              rows={approvedPayments.map((p) => [
                p.user_id?.name || p.userName || '-',
                p.plan || p.planName,
                `Rs ${p.amount}`,
                p.payment_id || p.paymentId || '-',
                new Date(p.approved_at || p.approvedAt).toLocaleString()
              ])}
              pageSize={5}
            />
          </div>
        ) : null}

        {rejectedPayments.length > 0 ? (
          <div className="rounded-2xl border border-rose-300/25 bg-rose-500/10 p-4 md:p-5">
            <h3 className="text-base font-bold text-rose-100 mb-3">Rejected ({rejectedPayments.length})</h3>
            <TablePanel
              columnClassName="text-xs"
              columns={['User', 'Plan', 'Amount', 'Payment ID', 'Rejected At']}
              rows={rejectedPayments.map((p) => [
                p.user_id?.name || p.userName || '-',
                p.plan || p.planName,
                `Rs ${p.amount}`,
                p.payment_id || p.paymentId || '-',
                new Date(p.rejected_at || p.rejectedAt).toLocaleString()
              ])}
              pageSize={5}
            />
          </div>
        ) : null}
      </div>

      {(!payments || payments.length === 0) && (
        <div className="text-center py-14 rounded-2xl border border-cyan-200/20 bg-[#0a1a36]/58">
          <p className="text-4xl mb-2">💳</p>
          <p className="text-slate-100 text-lg font-semibold">No payments yet</p>
          <p className="text-slate-400 text-sm mt-1">Incoming payment requests will appear here for review.</p>
        </div>
      )}
    </div>
  );
}

function ReportsPanel({ reports, onResolve, onOpenDetail }) {
  return <TablePanel title="Reports and Safety Queue" columns={['Target', 'Type', 'Reason', 'Priority', 'Status', 'Action']} rows={reports.map((report) => [
    report.target_user_id?.email || report.target_id || '-',
    report.target_type,
    report.reason,
    report.priority,
    report.status,
    report.status === 'resolved' ? 'Resolved' : <button key={report._id} className="text-xs px-2 py-1 rounded bg-green-100 text-green-700" onClick={() => onResolve(report._id)}>Resolve</button>
  ])} pageSize={10} onRowClick={(rowIndex) => onOpenDetail('Report Detail', reports[rowIndex])} />;
}

function ModerationPanel({ photos }) {
  return <TablePanel title="Content Moderation Queue" columns={['User', 'Email', 'Profile Status', 'Has Live Photo', 'Has ID Card']} rows={photos.map((item) => [
    item.name,
    item.email,
    item.profile_approval_status,
    item.livePhoto ? 'Yes' : 'No',
    item.idCard ? 'Yes' : 'No'
  ])} />;
}

function CollegesPanel({ colleges }) {
  const total = colleges.length;
  const activeCount = colleges.filter((college) => college.is_active).length;
  const verificationRequiredCount = colleges.filter((college) => college.verification_required).length;
  const onboardingEnabledCount = colleges.filter((college) => college.onboarding_enabled).length;
  const inactiveCount = total - activeCount;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cyan-300/20 bg-gradient-to-r from-cyan-500/12 via-sky-500/8 to-transparent px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/70">Campus Operations</p>
            <p className="text-sm text-slate-200">Manage approved campuses, domain trust, and onboarding readiness across the network.</p>
          </div>
          <span className="inline-flex items-center rounded-full border border-cyan-200/30 bg-cyan-400/12 px-3 py-1 text-xs font-semibold text-cyan-100">
            {total} campus{total === 1 ? '' : 'es'} tracked
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard label="Total Campuses" value={total} tone="cyan" />
        <MetricCard label="Active" value={activeCount} tone="emerald" />
        <MetricCard label="Verification Required" value={verificationRequiredCount} tone="amber" />
        <MetricCard label="Onboarding Enabled" value={onboardingEnabledCount} tone="rose" />
      </div>

      {total > 0 ? (
        <div className="grid lg:grid-cols-2 gap-4">
          {colleges.map((college) => (
            <div key={college._id || `${college.name}-${college.domain}`} className="rounded-2xl border border-cyan-200/15 bg-[#0a1a36]/58 p-4 shadow-[0_18px_45px_rgba(2,12,27,0.28)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-white">{college.name || 'Unnamed College'}</p>
                  <p className="text-xs text-cyan-100/75 mt-1">{college.domain || 'No verified domain'}</p>
                </div>
                <span className={`text-[10px] uppercase tracking-[0.14em] px-2 py-1 rounded-full border ${college.is_active ? 'border-emerald-300/35 bg-emerald-500/15 text-emerald-100' : 'border-rose-300/35 bg-rose-500/15 text-rose-100'}`}>
                  {college.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-cyan-200/15 bg-white/5 p-2.5">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Verification</p>
                  <p className="text-sm font-semibold text-slate-100 mt-1">{college.verification_required ? 'Required' : 'Optional'}</p>
                </div>
                <div className="rounded-xl border border-cyan-200/15 bg-white/5 p-2.5">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Onboarding</p>
                  <p className="text-sm font-semibold text-slate-100 mt-1">{college.onboarding_enabled ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-[11px] px-2.5 py-1 rounded-full border border-cyan-300/25 bg-cyan-500/12 text-cyan-100">Domain: {college.domain || 'N/A'}</span>
                <span className="text-[11px] px-2.5 py-1 rounded-full border border-slate-300/20 bg-slate-500/10 text-slate-200">ID: {college._id || 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-cyan-200/20 bg-[#0a1a36]/58 px-6 py-14 text-center">
          <p className="text-4xl mb-2">🏫</p>
          <p className="text-slate-100 text-lg font-semibold">No campuses available yet</p>
          <p className="text-slate-400 text-sm mt-1">Add your first campus to enable domain-based student verification and onboarding.</p>
          <div className="mt-6 grid sm:grid-cols-3 gap-2 max-w-3xl mx-auto">
            <div className="rounded-xl border border-cyan-200/15 bg-white/5 px-3 py-2 text-left">
              <p className="text-xs uppercase tracking-[0.12em] text-cyan-100/70">Step 1</p>
              <p className="text-sm text-slate-200 mt-1">Create campus profile</p>
            </div>
            <div className="rounded-xl border border-cyan-200/15 bg-white/5 px-3 py-2 text-left">
              <p className="text-xs uppercase tracking-[0.12em] text-cyan-100/70">Step 2</p>
              <p className="text-sm text-slate-200 mt-1">Verify email domain</p>
            </div>
            <div className="rounded-xl border border-cyan-200/15 bg-white/5 px-3 py-2 text-left">
              <p className="text-xs uppercase tracking-[0.12em] text-cyan-100/70">Step 3</p>
              <p className="text-sm text-slate-200 mt-1">Enable onboarding flow</p>
            </div>
          </div>
        </div>
      )}

      {inactiveCount > 0 ? (
        <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 px-4 py-3">
          <p className="text-sm text-amber-100">
            {inactiveCount} campus{inactiveCount === 1 ? ' is' : 'es are'} currently inactive. Review onboarding and verification settings before reactivation.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function SupportPanel({ tickets, settings = [], onUpdateSetting, onNotify }) {
  const contactSetting = settings.find((item) => item.key === 'support_contact_config');
  const rawContact = contactSetting?.value;
  const parsedContact = React.useMemo(() => {
    if (!rawContact) {
      return {};
    }
    if (typeof rawContact === 'string') {
      try {
        return JSON.parse(rawContact);
      } catch {
        return {};
      }
    }
    return typeof rawContact === 'object' ? rawContact : {};
  }, [rawContact]);

  const [contactDraft, setContactDraft] = React.useState({
    supportEmail: '',
    escalationEmail: '',
    supportPhone: '',
    whatsapp: '',
    instagramId: '',
    telegramId: '',
    supportHandle: '',
    helpCenterUrl: '',
    officeHours: '',
    responseSlaHours: ''
  });
  const [savingContact, setSavingContact] = React.useState(false);

  React.useEffect(() => {
    setContactDraft((prev) => ({
      ...prev,
      supportEmail: parsedContact.supportEmail || '',
      escalationEmail: parsedContact.escalationEmail || '',
      supportPhone: parsedContact.supportPhone || '',
      whatsapp: parsedContact.whatsapp || '',
      instagramId: parsedContact.instagramId || '',
      telegramId: parsedContact.telegramId || '',
      supportHandle: parsedContact.supportHandle || '',
      helpCenterUrl: parsedContact.helpCenterUrl || '',
      officeHours: parsedContact.officeHours || '',
      responseSlaHours: parsedContact.responseSlaHours || ''
    }));
  }, [parsedContact]);

  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t) => ['open', 'pending', 'new'].includes(String(t.status || '').toLowerCase())).length;
  const resolvedTickets = tickets.filter((t) => ['resolved', 'closed', 'done'].includes(String(t.status || '').toLowerCase())).length;
  const highPriorityTickets = tickets.filter((t) => ['high', 'urgent', 'critical', 'p1'].includes(String(t.priority || '').toLowerCase())).length;
  const slaHealth = totalTickets ? Math.max(0, Math.min(100, Math.round((resolvedTickets / totalTickets) * 100))) : 100;

  const saveContactConfig = async () => {
    try {
      setSavingContact(true);
      await onUpdateSetting?.('support_contact_config', {
        supportEmail: String(contactDraft.supportEmail || '').trim(),
        escalationEmail: String(contactDraft.escalationEmail || '').trim(),
        supportPhone: String(contactDraft.supportPhone || '').trim(),
        whatsapp: String(contactDraft.whatsapp || '').trim(),
        instagramId: String(contactDraft.instagramId || '').trim(),
        telegramId: String(contactDraft.telegramId || '').trim(),
        supportHandle: String(contactDraft.supportHandle || '').trim(),
        helpCenterUrl: String(contactDraft.helpCenterUrl || '').trim(),
        officeHours: String(contactDraft.officeHours || '').trim(),
        responseSlaHours: String(contactDraft.responseSlaHours || '').trim()
      });
      onNotify?.('Support contact details updated.');
    } catch (err) {
      onNotify?.(err?.message || 'Failed to save support contact details', 'error');
    } finally {
      setSavingContact(false);
    }
  };

  const inputClass = 'mt-1 w-full rounded-xl bg-white/8 border border-cyan-200/20 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/40';

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cyan-300/20 bg-gradient-to-r from-cyan-500/12 via-sky-500/8 to-transparent px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/70">Support Command Center</p>
            <p className="text-sm text-slate-200">Manage support queue performance and live contact channels from one operational surface.</p>
          </div>
          <span className="inline-flex items-center rounded-full border border-cyan-200/30 bg-cyan-400/12 px-3 py-1 text-xs font-semibold text-cyan-100">
            SLA Health {slaHealth}%
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-3">
        <MetricCard label="Total Tickets" value={totalTickets} tone="cyan" />
        <MetricCard label="Open Queue" value={openTickets} tone="amber" />
        <MetricCard label="Resolved" value={resolvedTickets} tone="emerald" />
        <MetricCard label="High Priority" value={highPriorityTickets} tone="rose" />
        <MetricCard label="Resolution Rate" value={`${slaHealth}%`} tone="slate" />
      </div>

      <div className="grid xl:grid-cols-[1.2fr_1fr] gap-4">
        <div className="rounded-2xl border border-cyan-200/15 bg-[#0a1a36]/58 p-4 md:p-5 shadow-[0_18px_45px_rgba(2,12,27,0.28)]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-white">Support Queue</h3>
            <span className="text-xs text-cyan-100/75">Live operational list</span>
          </div>

          {tickets.length ? (
            <div className="space-y-2.5 max-h-[56vh] overflow-auto pr-1">
              {tickets.slice(0, 40).map((ticket, idx) => {
                const priority = String(ticket.priority || 'normal').toLowerCase();
                const status = String(ticket.status || 'open').toLowerCase();
                const priorityClass = priority.includes('high') || priority.includes('urgent') || priority.includes('critical')
                  ? 'border-rose-300/30 bg-rose-500/12 text-rose-100'
                  : 'border-cyan-300/25 bg-cyan-500/12 text-cyan-100';
                const statusClass = ['resolved', 'closed', 'done'].includes(status)
                  ? 'border-emerald-300/30 bg-emerald-500/12 text-emerald-100'
                  : 'border-amber-300/30 bg-amber-500/12 text-amber-100';

                return (
                  <div key={ticket._id || `${ticket.subject}-${idx}`} className="rounded-xl border border-cyan-200/15 bg-white/5 px-3 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{ticket.subject || 'Support Ticket'}</p>
                        <p className="text-xs text-slate-300 mt-1">{ticket.user_id?.email || ticket.email || 'Unknown user'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-full border ${priorityClass}`}>{priority}</span>
                        <span className={`text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-full border ${statusClass}`}>{status}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Updated {new Date(ticket.updated_at || ticket.created_at || Date.now()).toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-cyan-200/15 bg-white/5 px-4 py-10 text-center">
              <p className="text-3xl mb-2">🎧</p>
              <p className="text-slate-100 font-semibold">No support tickets in this range</p>
              <p className="text-sm text-slate-400 mt-1">Incoming support requests will appear here automatically.</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-cyan-200/15 bg-[#0a1a36]/58 p-4 md:p-5 shadow-[0_18px_45px_rgba(2,12,27,0.28)]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-white">Contact Control Center</h3>
            <button onClick={saveContactConfig} disabled={savingContact} className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-500 transition disabled:opacity-60">
              {savingContact ? 'Saving...' : 'Save'}
            </button>
          </div>
          <div className="space-y-3 max-h-[56vh] overflow-auto pr-1">
            <label className="text-xs text-slate-300">Primary Support Email
              <input value={contactDraft.supportEmail} onChange={(event) => setContactDraft((prev) => ({ ...prev, supportEmail: event.target.value }))} placeholder="support@cudaters.com" className={inputClass} />
            </label>
            <label className="text-xs text-slate-300">Escalation Email
              <input value={contactDraft.escalationEmail} onChange={(event) => setContactDraft((prev) => ({ ...prev, escalationEmail: event.target.value }))} placeholder="escalations@cudaters.com" className={inputClass} />
            </label>
            <label className="text-xs text-slate-300">Support Phone
              <input value={contactDraft.supportPhone} onChange={(event) => setContactDraft((prev) => ({ ...prev, supportPhone: event.target.value }))} placeholder="+91 98XXXXXX10" className={inputClass} />
            </label>
            <label className="text-xs text-slate-300">WhatsApp Number
              <input value={contactDraft.whatsapp} onChange={(event) => setContactDraft((prev) => ({ ...prev, whatsapp: event.target.value }))} placeholder="+91 98XXXXXX10" className={inputClass} />
            </label>
            <label className="text-xs text-slate-300">Instagram ID
              <input value={contactDraft.instagramId} onChange={(event) => setContactDraft((prev) => ({ ...prev, instagramId: event.target.value }))} placeholder="@cu_daters_support" className={inputClass} />
            </label>
            <label className="text-xs text-slate-300">Telegram ID
              <input value={contactDraft.telegramId} onChange={(event) => setContactDraft((prev) => ({ ...prev, telegramId: event.target.value }))} placeholder="@cudatershelp" className={inputClass} />
            </label>
            <label className="text-xs text-slate-300">Support Handle / Contact ID
              <input value={contactDraft.supportHandle} onChange={(event) => setContactDraft((prev) => ({ ...prev, supportHandle: event.target.value }))} placeholder="CU-Daters Support Ops" className={inputClass} />
            </label>
            <label className="text-xs text-slate-300">Help Center URL
              <input value={contactDraft.helpCenterUrl} onChange={(event) => setContactDraft((prev) => ({ ...prev, helpCenterUrl: event.target.value }))} placeholder="https://help.cudaters.com" className={inputClass} />
            </label>
            <label className="text-xs text-slate-300">Office Hours
              <input value={contactDraft.officeHours} onChange={(event) => setContactDraft((prev) => ({ ...prev, officeHours: event.target.value }))} placeholder="Mon-Sat, 9:00 AM - 8:00 PM" className={inputClass} />
            </label>
            <label className="text-xs text-slate-300">Response SLA (hours)
              <input value={contactDraft.responseSlaHours} onChange={(event) => setContactDraft((prev) => ({ ...prev, responseSlaHours: event.target.value }))} placeholder="6" className={inputClass} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsPanel({ analytics }) {
  if (!analytics) {
    return <p className="text-slate-300">No analytics data available.</p>;
  }

  const dau = Number(analytics.dailyActiveUsers) || 0;
  const wau = Number(analytics.weeklyActiveUsers) || 0;
  const mau = Number(analytics.monthlyActiveUsers) || 0;
  const signups = Number(analytics.newSignups) || 0;
  const messages = Number(analytics.messageActivity) || 0;
  const premiumConversion = Number(analytics.premiumConversionRate) || 0;
  const matchRate = Number(analytics.matchRate) || 0;
  const retention = Number(analytics.retentionHint) || 0;

  const trendSeries = Array.isArray(analytics.engagementTrend) && analytics.engagementTrend.length >= 5
    ? analytics.engagementTrend.map((value) => Number(value) || 0).slice(-7)
    : [
        Math.max(0, Math.round(dau * 0.72)),
        Math.max(0, Math.round(dau * 0.81)),
        Math.max(0, Math.round(dau * 0.76)),
        Math.max(0, Math.round(dau * 0.9)),
        Math.max(0, Math.round(dau * 0.95)),
        Math.max(0, Math.round(dau * 0.88)),
        Math.max(0, dau)
      ];

  const trendMax = Math.max(...trendSeries, 1);
  const linePoints = trendSeries.map((value, idx) => {
    const x = (idx / Math.max(trendSeries.length - 1, 1)) * 100;
    const y = 100 - (value / trendMax) * 100;
    return `${x},${y}`;
  }).join(' ');
  const areaPoints = `0,100 ${linePoints} 100,100`;

  const kpiBars = [
    { label: 'DAU', value: dau },
    { label: 'WAU', value: wau },
    { label: 'MAU', value: mau },
    { label: 'Signups', value: signups },
    { label: 'Messages', value: messages }
  ];
  const kpiMax = Math.max(...kpiBars.map((item) => item.value), 1);

  const acquisition = Math.max(signups, 1);
  const premiumUsers = Math.max(Math.round((premiumConversion / 100) * signups), 0);
  const conversionSegments = [
    { label: 'Free', value: Math.max(acquisition - premiumUsers, 0), color: '#0ea5e9' },
    { label: 'Premium', value: premiumUsers, color: '#f59e0b' }
  ];
  const segmentTotal = Math.max(conversionSegments.reduce((sum, item) => sum + item.value, 0), 1);
  let runningOffset = 0;
  const donutSegments = conversionSegments.map((segment) => {
    const dash = (segment.value / segmentTotal) * 100;
    const strokeDasharray = `${dash} ${100 - dash}`;
    const strokeDashoffset = -runningOffset;
    runningOffset += dash;
    return { ...segment, strokeDasharray, strokeDashoffset };
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cyan-300/20 bg-gradient-to-r from-cyan-500/12 via-sky-500/8 to-transparent px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/70">Growth Intelligence</p>
            <p className="text-sm text-slate-200">Core product health, trend momentum, and conversion quality in one analytics surface.</p>
          </div>
          <span className="inline-flex items-center rounded-full border border-cyan-200/30 bg-cyan-400/12 px-3 py-1 text-xs font-semibold text-cyan-100">
            Live dashboard mode
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <MetricCard label="DAU" value={dau} tone="cyan" />
        <MetricCard label="WAU" value={wau} tone="slate" />
        <MetricCard label="MAU" value={mau} tone="slate" />
        <MetricCard label="New Signups" value={signups} tone="emerald" />
        <MetricCard label="Premium Conversion" value={`${premiumConversion}%`} tone="amber" />
        <MetricCard label="Match Rate" value={`${matchRate}%`} tone="rose" />
        <MetricCard label="Message Activity" value={messages} tone="cyan" />
        <MetricCard label="Retention Indicator" value={`${retention}%`} tone="emerald" />
      </div>

      <div className="grid xl:grid-cols-[1.6fr_1fr] gap-4">
        <div className="rounded-2xl border border-cyan-200/15 bg-[#0a1a36]/58 p-4 md:p-5 shadow-[0_18px_45px_rgba(2,12,27,0.28)]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-white">7-Day Engagement Trend</h3>
            <span className="text-xs text-cyan-100/75">Area + line analysis</span>
          </div>
          <div className="h-56 rounded-xl border border-cyan-200/15 bg-black/25 p-3">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {[20, 40, 60, 80].map((grid) => (
                <line key={grid} x1="0" y1={grid} x2="100" y2={grid} stroke="rgba(148,163,184,0.18)" strokeWidth="0.4" />
              ))}
              <polygon points={areaPoints} fill="url(#trendFill)" />
              <polyline points={linePoints} fill="none" stroke="#22d3ee" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </div>
          <div className="grid grid-cols-7 gap-2 mt-3">
            {trendSeries.map((value, idx) => (
              <div key={`day-${idx}`} className="text-center">
                <p className="text-[10px] text-slate-400">D-{6 - idx}</p>
                <p className="text-xs font-semibold text-slate-100">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-200/15 bg-[#0a1a36]/58 p-4 md:p-5 shadow-[0_18px_45px_rgba(2,12,27,0.28)]">
          <h3 className="text-sm font-bold uppercase tracking-wide text-white mb-3">Plan Mix</h3>
          <div className="flex items-center justify-center py-2">
            <svg viewBox="0 0 42 42" className="w-44 h-44 -rotate-90">
              <circle cx="21" cy="21" r="15.915" fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="4" />
              {donutSegments.map((segment) => (
                <circle
                  key={segment.label}
                  cx="21"
                  cy="21"
                  r="15.915"
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="4"
                  strokeDasharray={segment.strokeDasharray}
                  strokeDashoffset={segment.strokeDashoffset}
                  strokeLinecap="round"
                />
              ))}
            </svg>
          </div>
          <div className="space-y-2 mt-1">
            {conversionSegments.map((segment) => (
              <div key={segment.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-200">
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                  <span>{segment.label}</span>
                </div>
                <span className="font-semibold text-white">{segment.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-cyan-200/15 bg-[#0a1a36]/58 p-4 md:p-5 shadow-[0_18px_45px_rgba(2,12,27,0.28)]">
        <h3 className="text-sm font-bold uppercase tracking-wide text-white mb-3">Comparative KPI Bars</h3>
        <div className="space-y-3">
          {kpiBars.map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>{item.label}</span>
                <span>{item.value}</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-900/60 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-500" style={{ width: `${Math.max(6, (item.value / kpiMax) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({ settings, onUpdate }) {
  const [draftKey, setDraftKey] = React.useState('');
  const [draftValue, setDraftValue] = React.useState('');
  const legalSetting = settings.find((item) => item.key === 'legal_content_config');
  const legalRaw = legalSetting?.value;
  const parsedLegal = React.useMemo(() => {
    if (!legalRaw) {
      return {};
    }
    if (typeof legalRaw === 'string') {
      try {
        return JSON.parse(legalRaw);
      } catch {
        return {};
      }
    }
    return typeof legalRaw === 'object' ? legalRaw : {};
  }, [legalRaw]);

  const [legalDraft, setLegalDraft] = React.useState({
    appName: '',
    companyName: '',
    termsLastUpdated: '',
    privacyLastUpdated: '',
    legalEmail: '',
    privacyEmail: '',
    supportEmail: '',
    disputeResponseDays: '',
    arbitrationCity: '',
    governingLaw: '',
    mailingAddress: '',
    termsBlocks: [],
    privacyBlocks: []
  });
  const [savingLegal, setSavingLegal] = React.useState(false);

  const normalizeBlocks = React.useCallback((blocks, fallback) => {
    const source = Array.isArray(blocks) ? blocks : fallback;
    return source.map((block, index) => ({
      id: block?.id || `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
      title: String(block?.title || '').trim(),
      body: String(block?.body || '').trim()
    }));
  }, []);

  const defaultTermsBlocks = React.useMemo(() => ([
    { title: 'Acceptance of Terms', body: 'By using the app, users agree to these terms and any future updates announced by the platform.' },
    { title: 'User Conduct', body: 'Users must behave respectfully and must not engage in harassment, fraud, abuse, impersonation, or illegal activity.' }
  ]), []);

  const defaultPrivacyBlocks = React.useMemo(() => ([
    { title: 'Information We Collect', body: 'We collect account, profile, and usage information required to provide the service and keep the community safe.' },
    { title: 'How We Use Information', body: 'Information is used for account management, feature delivery, moderation, support, and legal compliance.' }
  ]), []);

  React.useEffect(() => {
    setLegalDraft((prev) => ({
      ...prev,
      appName: parsedLegal.appName || 'CU-Daters',
      companyName: parsedLegal.companyName || 'CU-Daters',
      termsLastUpdated: parsedLegal.termsLastUpdated || 'March 2026',
      privacyLastUpdated: parsedLegal.privacyLastUpdated || 'March 2026',
      legalEmail: parsedLegal.legalEmail || 'legal@cudaters.in',
      privacyEmail: parsedLegal.privacyEmail || 'privacy@cudaters.in',
      supportEmail: parsedLegal.supportEmail || 'support@cudaters.in',
      disputeResponseDays: parsedLegal.disputeResponseDays || '7',
      arbitrationCity: parsedLegal.arbitrationCity || 'Chandigarh, India',
      governingLaw: parsedLegal.governingLaw || 'Laws of India',
      mailingAddress: parsedLegal.mailingAddress || 'Chandigarh University, Chandigarh, India',
      termsBlocks: normalizeBlocks(parsedLegal.termsBlocks, defaultTermsBlocks),
      privacyBlocks: normalizeBlocks(parsedLegal.privacyBlocks, defaultPrivacyBlocks)
    }));
  }, [defaultPrivacyBlocks, defaultTermsBlocks, normalizeBlocks, parsedLegal]);

  const updateBlock = (field, id, patch) => {
    setLegalDraft((prev) => ({
      ...prev,
      [field]: (prev[field] || []).map((item) => (item.id === id ? { ...item, ...patch } : item))
    }));
  };

  const addBlock = (field) => {
    setLegalDraft((prev) => ({
      ...prev,
      [field]: [
        ...(prev[field] || []),
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title: '', body: '' }
      ]
    }));
  };

  const removeBlock = (field, id) => {
    setLegalDraft((prev) => ({
      ...prev,
      [field]: (prev[field] || []).filter((item) => item.id !== id)
    }));
  };

  const saveLegalContent = async () => {
    try {
      setSavingLegal(true);
      await onUpdate('legal_content_config', {
        appName: String(legalDraft.appName || '').trim(),
        companyName: String(legalDraft.companyName || '').trim(),
        termsLastUpdated: String(legalDraft.termsLastUpdated || '').trim(),
        privacyLastUpdated: String(legalDraft.privacyLastUpdated || '').trim(),
        legalEmail: String(legalDraft.legalEmail || '').trim(),
        privacyEmail: String(legalDraft.privacyEmail || '').trim(),
        supportEmail: String(legalDraft.supportEmail || '').trim(),
        disputeResponseDays: String(legalDraft.disputeResponseDays || '').trim(),
        arbitrationCity: String(legalDraft.arbitrationCity || '').trim(),
        governingLaw: String(legalDraft.governingLaw || '').trim(),
        mailingAddress: String(legalDraft.mailingAddress || '').trim(),
        termsBlocks: (legalDraft.termsBlocks || [])
          .map((block) => ({ title: String(block.title || '').trim(), body: String(block.body || '').trim() }))
          .filter((block) => block.title || block.body),
        privacyBlocks: (legalDraft.privacyBlocks || [])
          .map((block) => ({ title: String(block.title || '').trim(), body: String(block.body || '').trim() }))
          .filter((block) => block.title || block.body)
      });
    } finally {
      setSavingLegal(false);
    }
  };

  const inputClass = 'mt-1 w-full rounded-xl bg-white/8 border border-cyan-200/20 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/40';

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-cyan-200/15 bg-[#0a1a36]/58 p-4 md:p-5 shadow-[0_18px_45px_rgba(2,12,27,0.28)]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white">Legal Content Control Center</h3>
            <p className="text-xs text-cyan-100/75 mt-1">Manage Terms and Privacy public details from admin.</p>
          </div>
          <button onClick={saveLegalContent} disabled={savingLegal} className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-500 transition disabled:opacity-60">
            {savingLegal ? 'Saving...' : 'Save Legal Content'}
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <label className="text-xs text-slate-300">App Name
            <input value={legalDraft.appName} onChange={(event) => setLegalDraft((prev) => ({ ...prev, appName: event.target.value }))} className={inputClass} />
          </label>
          <label className="text-xs text-slate-300">Company Name
            <input value={legalDraft.companyName} onChange={(event) => setLegalDraft((prev) => ({ ...prev, companyName: event.target.value }))} className={inputClass} />
          </label>
          <label className="text-xs text-slate-300">Terms Last Updated
            <input value={legalDraft.termsLastUpdated} onChange={(event) => setLegalDraft((prev) => ({ ...prev, termsLastUpdated: event.target.value }))} className={inputClass} />
          </label>
          <label className="text-xs text-slate-300">Privacy Last Updated
            <input value={legalDraft.privacyLastUpdated} onChange={(event) => setLegalDraft((prev) => ({ ...prev, privacyLastUpdated: event.target.value }))} className={inputClass} />
          </label>
          <label className="text-xs text-slate-300">Legal Email
            <input value={legalDraft.legalEmail} onChange={(event) => setLegalDraft((prev) => ({ ...prev, legalEmail: event.target.value }))} className={inputClass} />
          </label>
          <label className="text-xs text-slate-300">Privacy Email
            <input value={legalDraft.privacyEmail} onChange={(event) => setLegalDraft((prev) => ({ ...prev, privacyEmail: event.target.value }))} className={inputClass} />
          </label>
          <label className="text-xs text-slate-300">Support Email
            <input value={legalDraft.supportEmail} onChange={(event) => setLegalDraft((prev) => ({ ...prev, supportEmail: event.target.value }))} className={inputClass} />
          </label>
          <label className="text-xs text-slate-300">Dispute Response (days)
            <input value={legalDraft.disputeResponseDays} onChange={(event) => setLegalDraft((prev) => ({ ...prev, disputeResponseDays: event.target.value }))} className={inputClass} />
          </label>
          <label className="text-xs text-slate-300">Arbitration City
            <input value={legalDraft.arbitrationCity} onChange={(event) => setLegalDraft((prev) => ({ ...prev, arbitrationCity: event.target.value }))} className={inputClass} />
          </label>
          <label className="text-xs text-slate-300">Governing Law
            <input value={legalDraft.governingLaw} onChange={(event) => setLegalDraft((prev) => ({ ...prev, governingLaw: event.target.value }))} className={inputClass} />
          </label>
          <label className="text-xs text-slate-300 md:col-span-2">Mailing Address
            <input value={legalDraft.mailingAddress} onChange={(event) => setLegalDraft((prev) => ({ ...prev, mailingAddress: event.target.value }))} className={inputClass} />
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="rounded-xl border border-cyan-200/15 bg-white/5 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-[0.14em] text-cyan-100/70">Terms Content Blocks</p>
              <button type="button" onClick={() => addBlock('termsBlocks')} className="px-2.5 py-1 rounded-lg text-[11px] border border-cyan-300/40 bg-cyan-500/15 text-cyan-100">Add Block</button>
            </div>
            <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
              {(legalDraft.termsBlocks || []).map((block, index) => (
                <div key={block.id} className="rounded-lg border border-cyan-200/15 bg-black/20 p-2.5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-[11px] text-slate-300">Section {index + 1}</p>
                    <button type="button" onClick={() => removeBlock('termsBlocks', block.id)} className="text-[11px] px-2 py-0.5 rounded border border-rose-300/40 text-rose-200">Remove</button>
                  </div>
                  <input value={block.title} onChange={(event) => updateBlock('termsBlocks', block.id, { title: event.target.value })} placeholder="Section title" className={inputClass} />
                  <textarea value={block.body} onChange={(event) => updateBlock('termsBlocks', block.id, { body: event.target.value })} placeholder="Section content" rows={3} className={inputClass} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-cyan-200/15 bg-white/5 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs uppercase tracking-[0.14em] text-cyan-100/70">Privacy Content Blocks</p>
              <button type="button" onClick={() => addBlock('privacyBlocks')} className="px-2.5 py-1 rounded-lg text-[11px] border border-cyan-300/40 bg-cyan-500/15 text-cyan-100">Add Block</button>
            </div>
            <div className="space-y-2 max-h-[320px] overflow-auto pr-1">
              {(legalDraft.privacyBlocks || []).map((block, index) => (
                <div key={block.id} className="rounded-lg border border-cyan-200/15 bg-black/20 p-2.5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-[11px] text-slate-300">Section {index + 1}</p>
                    <button type="button" onClick={() => removeBlock('privacyBlocks', block.id)} className="text-[11px] px-2 py-0.5 rounded border border-rose-300/40 text-rose-200">Remove</button>
                  </div>
                  <input value={block.title} onChange={(event) => updateBlock('privacyBlocks', block.id, { title: event.target.value })} placeholder="Section title" className={inputClass} />
                  <textarea value={block.body} onChange={(event) => updateBlock('privacyBlocks', block.id, { body: event.target.value })} placeholder="Section content" rows={3} className={inputClass} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <TablePanel title="Platform Settings" columns={['Key', 'Value', 'Description']} rows={settings.map((setting) => [
        setting.key,
        typeof setting.value === 'object' ? JSON.stringify(setting.value) : String(setting.value),
        setting.description || '-'
      ])} />

      <div className="rounded-2xl border border-softPink/40 p-4">
        <p className="font-bold text-darkBrown mb-2">Quick Setting Update</p>
        <div className="grid md:grid-cols-[1fr_1fr_auto] gap-2">
          <input value={draftKey} onChange={(event) => setDraftKey(event.target.value)} placeholder="setting key" className="px-3 py-2 rounded-lg border border-softPink/70" />
          <input value={draftValue} onChange={(event) => setDraftValue(event.target.value)} placeholder="setting value" className="px-3 py-2 rounded-lg border border-softPink/70" />
          <button className="btn-primary" onClick={() => onUpdate(draftKey, draftValue)}>Save</button>
        </div>
      </div>
    </div>
  );
}

function ActivityPanel({ logs }) {
  const normalizedLogs = React.useMemo(() => {
    return (logs || []).map((log, index) => {
      const action = String(log?.action || log?.event || log?.type || 'activity').trim();
      const status = String(log?.status || log?.result || 'info').trim().toLowerCase();
      const actor = log?.admin_id?.email || log?.user_id?.email || log?.actor?.email || log?.actor || 'system';
      const rawTs = log?.timestamp || log?.createdAt || log?.updatedAt;
      const ts = rawTs ? new Date(rawTs).getTime() : 0;
      const safeTs = Number.isFinite(ts) ? ts : 0;
      return {
        id: log?._id || `${action}-${safeTs}-${index}`,
        action,
        status,
        actor,
        timestamp: safeTs,
        readableTime: safeTs ? new Date(safeTs).toLocaleString() : 'Unknown time',
        description: log?.description || log?.note || log?.message || ''
      };
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [logs]);

  const totalEvents = normalizedLogs.length;
  const criticalEvents = normalizedLogs.filter((item) => /failed|error|reject|denied|blocked/.test(item.status) || /delete|ban|suspend|reject/.test(item.action.toLowerCase()));
  const sensitiveEvents = normalizedLogs.filter((item) => /delete|ban|suspend|reject|pin|payment|settings|config|approve/.test(item.action.toLowerCase()));
  const uniqueActors = new Set(normalizedLogs.map((item) => item.actor)).size;
  const latestEvent = normalizedLogs[0];

  const actorDistribution = React.useMemo(() => {
    const tally = new Map();
    normalizedLogs.forEach((item) => {
      tally.set(item.actor, (tally.get(item.actor) || 0) + 1);
    });
    return Array.from(tally.entries())
      .map(([actor, count]) => ({ actor, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [normalizedLogs]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cyan-300/20 bg-gradient-to-r from-cyan-500/12 via-sky-500/8 to-transparent px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-100/70">Security Operations Timeline</p>
            <p className="text-sm text-slate-200">Track sensitive admin actions, detect high-risk events, and maintain compliance visibility.</p>
          </div>
          <span className="inline-flex items-center rounded-full border border-cyan-200/30 bg-cyan-400/12 px-3 py-1 text-xs font-semibold text-cyan-100">
            {totalEvents} events in current window
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-3">
        <MetricCard label="Total Events" value={totalEvents} tone="cyan" />
        <MetricCard label="Critical Flags" value={criticalEvents.length} tone="rose" />
        <MetricCard label="Sensitive Actions" value={sensitiveEvents.length} tone="amber" />
        <MetricCard label="Unique Actors" value={uniqueActors} tone="emerald" />
        <MetricCard label="Latest Event" value={latestEvent ? 'Live' : 'No Data'} tone="slate" />
      </div>

      {!totalEvents ? (
        <div className="rounded-2xl border border-cyan-200/20 bg-[#0a1a36]/58 px-6 py-14 text-center">
          <p className="text-4xl mb-2">📋</p>
          <p className="text-slate-100 text-lg font-semibold">No audit events in this time range</p>
          <p className="text-slate-400 text-sm mt-1">Adjust filters or wait for the next admin activity cycle.</p>
          <div className="mt-6 inline-flex rounded-full border border-emerald-300/30 bg-emerald-500/12 px-3 py-1 text-xs text-emerald-100">
            Audit pipeline healthy
          </div>
        </div>
      ) : (
        <>
          <div className="grid xl:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-rose-300/25 bg-rose-500/10 p-4 md:p-5">
              <h3 className="text-sm font-bold uppercase tracking-wide text-rose-100 mb-3">Critical Event Focus</h3>
              {criticalEvents.length ? (
                <div className="space-y-2.5">
                  {criticalEvents.slice(0, 6).map((item) => (
                    <div key={`critical-${item.id}`} className="rounded-xl border border-rose-300/25 bg-black/20 px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-rose-100">{item.action}</p>
                        <span className="text-[11px] px-2 py-0.5 rounded-full border border-rose-300/25 bg-rose-500/15 text-rose-100 uppercase">{item.status}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{item.actor} • {item.readableTime}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-emerald-200">No critical flags detected in this range.</p>
              )}
            </div>

            <div className="rounded-2xl border border-cyan-300/25 bg-cyan-500/10 p-4 md:p-5">
              <h3 className="text-sm font-bold uppercase tracking-wide text-cyan-100 mb-3">Actor Distribution</h3>
              <div className="space-y-2.5">
                {actorDistribution.map((item) => {
                  const width = Math.max(10, Math.round((item.count / Math.max(actorDistribution[0]?.count || 1, 1)) * 100));
                  return (
                    <div key={`actor-${item.actor}`}>
                      <div className="flex items-center justify-between text-xs text-slate-200 mb-1">
                        <span className="truncate pr-2">{item.actor}</span>
                        <span>{item.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-900/60 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-500" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-200/15 bg-[#0a1a36]/58 p-4 md:p-5 shadow-[0_18px_45px_rgba(2,12,27,0.28)]">
            <h3 className="text-sm font-bold uppercase tracking-wide text-white mb-3">Audit Event Stream</h3>
            <div className="space-y-2.5 max-h-[56vh] overflow-auto pr-1">
              {normalizedLogs.slice(0, 40).map((item) => {
                const isCritical = /failed|error|reject|denied|blocked/.test(item.status) || /delete|ban|suspend|reject/.test(item.action.toLowerCase());
                return (
                  <div key={item.id} className={`rounded-xl border px-3 py-3 ${isCritical ? 'border-rose-300/30 bg-rose-500/10' : 'border-cyan-200/15 bg-white/5'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-100">{item.action}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase tracking-[0.12em] px-2 py-0.5 rounded-full border ${isCritical ? 'border-rose-300/35 bg-rose-500/20 text-rose-100' : 'border-emerald-300/30 bg-emerald-500/12 text-emerald-100'}`}>{item.status}</span>
                        <span className="text-xs text-slate-400">{item.readableTime}</span>
                      </div>
                    </div>
                    <p className="text-xs text-cyan-100/75 mt-1">Actor: {item.actor}</p>
                    {item.description ? <p className="text-xs text-slate-300 mt-1">{item.description}</p> : null}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TablePanel({ title, columns, rows, pageSize = 12, onRowClick }) {
  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    setPage(1);
  }, [rows.length, pageSize]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageRows = rows.slice(startIndex, startIndex + pageSize);

  return (
    <div className="admin-surface-strong rounded-2xl border overflow-hidden shadow-[0_20px_56px_rgba(2,10,27,0.5)] backdrop-blur-xl">
      <div className="px-5 py-4 border-b border-cyan-200/15 bg-gradient-to-r from-cyan-500/15 to-blue-500/8">
        <h3 className="font-semibold text-base text-white flex items-center gap-2">
          {title}
          <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-400/12 text-cyan-100 border border-cyan-200/20 font-semibold">{rows.length}</span>
        </h3>
      </div>
      <div className="overflow-auto max-h-[60vh]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 admin-surface-strong text-slate-200 border-b border-cyan-200/15">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 text-left font-semibold uppercase text-[11px] tracking-wider text-cyan-100/75">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length ? pageRows.map((row, index) => (
              <tr key={index} className={`border-b border-cyan-200/10 ${onRowClick ? 'cursor-pointer hover:bg-cyan-400/8 transition-colors' : 'hover:bg-white/6 transition-colors'}`} onClick={() => onRowClick?.(startIndex + index)}>
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="px-4 py-3 text-slate-100 font-medium align-top">{cell}</td>
                ))}
              </tr>
            )) : (
              <tr>
                <td className="px-4 py-10 text-slate-400 text-center" colSpan={columns.length}>
                  <p className="text-base font-medium">No records found</p>
                  <p className="text-xs mt-1">Try adjusting filters or search criteria.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {rows.length > pageSize ? (
        <div className="admin-surface-strong px-5 py-3 border-t border-cyan-200/15 flex items-center justify-between">
          <span className="text-xs text-slate-300 font-medium">
            Showing <span className="text-white font-semibold">{startIndex + 1}-{Math.min(startIndex + pageSize, rows.length)}</span> of <span className="text-white font-semibold">{rows.length}</span>
          </span>
          <div className="flex items-center gap-2">
            <button 
              className="px-3 py-1.5 rounded-lg border border-cyan-200/30 hover:border-cyan-200/55 text-slate-200 hover:text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed" 
              disabled={safePage === 1} 
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Prev
            </button>
            <span className="text-xs font-semibold text-slate-100 px-2">
              {safePage}/{totalPages}
            </span>
            <button 
              className="px-3 py-1.5 rounded-lg border border-cyan-200/30 hover:border-cyan-200/55 text-slate-200 hover:text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed" 
              disabled={safePage === totalPages} 
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DetailDrawer({ title, data, onClose }) {
  if (!data) {
    return null;
  }

  const isProfileApproval = title.includes('Profile Approval') || title.includes('Registration Detail');
  const isPaymentDetail = title === 'Payment Detail';

  if (isProfileApproval) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex justify-end overflow-hidden" onClick={onClose}>
        <div className="w-full max-w-4xl h-full bg-white shadow-2xl overflow-auto" onClick={(event) => event.stopPropagation()}>
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blushPink to-softPink p-6 flex justify-between items-center shadow-md">
            <h2 className="text-3xl font-bold text-white">👤 {data.name || 'User Profile'}</h2>
            <button onClick={onClose} className="text-white text-3xl font-bold hover:scale-110 transition">✕</button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Badges */}
            <div className="flex gap-3 flex-wrap">
              <span className={`px-4 py-2 rounded-full text-white font-bold text-sm ${
                data.profile_approval_status === 'approved' ? 'bg-green-500' :
                data.profile_approval_status === 'rejected' ? 'bg-red-500' :
                data.profile_approval_status === 'pending' ? 'bg-yellow-500' :
                'bg-gray-400'
              }`}>
                Approval: {data.profile_approval_status?.toUpperCase() || 'PENDING'}
              </span>
              <span className={`px-4 py-2 rounded-full text-white font-bold text-sm ${
                data.status === 'active' ? 'bg-green-500' :
                data.status === 'banned' ? 'bg-red-500' :
                data.status === 'suspended' ? 'bg-orange-500' :
                'bg-gray-400'
              }`}>
                Account: {data.status?.toUpperCase() || 'PENDING'}
              </span>
              <span className={`px-4 py-2 rounded-full text-white font-bold text-sm ${data.is_verified ? 'bg-green-500' : 'bg-yellow-500'}`}>
                {data.is_verified ? '✅ Verified' : '⏳ Not Verified'}
              </span>
            </div>

            {/* Verification Documents - MAIN SECTION */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-6 border-2 border-orange-300">
              <h3 className="text-2xl font-bold text-darkBrown mb-4">📸 Verification Documents</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Live Photo */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg border-2 border-orange-200">
                  <div className="bg-gradient-to-r from-blushPink to-softPink p-3">
                    <p className="text-white font-bold">📷 Live Photo</p>
                  </div>
                  <div className="p-4 space-y-3">
                    {data.livePhoto ? (
                      <>
                        {data.livePhoto.startsWith('http') || data.livePhoto.startsWith('data:') ? (
                          <img src={data.livePhoto} alt="Live Photo" className="w-full h-64 object-cover rounded-lg border border-softPink" />
                        ) : (
                          <div className="w-full h-64 bg-creamyWhite rounded-lg border-2 border-dashed border-softPink flex items-center justify-center">
                            <p className="text-center text-softBrown">
                              <p className="font-bold mb-2">📄 Base64 Data</p>
                              <p className="text-xs break-all">{data.livePhoto.substring(0, 50)}...</p>
                            </p>
                          </div>
                        )}
                        <a href={data.livePhoto} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full text-center">View Full Size</a>
                      </>
                    ) : (
                      <div className="w-full h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <p className="text-gray-500 font-semibold">❌ No Live Photo Submitted</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ID Card */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg border-2 border-orange-200">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3">
                    <p className="text-white font-bold">🆔 ID Card / Verification Document</p>
                  </div>
                  <div className="p-4 space-y-3">
                    {data.idCard ? (
                      <>
                        {data.idCard.startsWith('http') || data.idCard.startsWith('data:') ? (
                          <img src={data.idCard} alt="ID Card" className="w-full h-64 object-cover rounded-lg border border-blue-400" />
                        ) : (
                          <div className="w-full h-64 bg-creamyWhite rounded-lg border-2 border-dashed border-blue-400 flex items-center justify-center">
                            <p className="text-center text-softBrown">
                              <p className="font-bold mb-2">📄 Base64 Data</p>
                              <p className="text-xs break-all">{data.idCard.substring(0, 50)}...</p>
                            </p>
                          </div>
                        )}
                        <a href={data.idCard} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full text-center">View Full Size</a>
                      </>
                    ) : (
                      <div className="w-full h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <p className="text-gray-500 font-semibold">❌ No ID Card Submitted</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="bg-gradient-to-br from-blushPink/10 to-softPink/10 rounded-2xl p-6 border border-softPink">
              <h3 className="text-2xl font-bold text-darkBrown mb-4">👤 Personal Information</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border border-softPink/30">
                  <p className="text-xs text-softBrown uppercase font-bold">Email</p>
                  <p className="text-sm font-bold text-darkBrown mt-1 break-all">{data.email || 'N/A'}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-softPink/30">
                  <p className="text-xs text-softBrown uppercase font-bold">Phone</p>
                  <p className="text-sm font-bold text-darkBrown mt-1">{data.phone || 'N/A'}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-softPink/30">
                  <p className="text-xs text-softBrown uppercase font-bold">Gender</p>
                  <p className="text-sm font-bold text-darkBrown mt-1 capitalize">{data.gender || 'N/A'}</p>
                </div>
              </div>
              <div className="mt-4 bg-white rounded-xl p-4 border border-softPink/30">
                <p className="text-xs text-softBrown uppercase font-bold">Bio / About</p>
                <p className="text-sm text-darkBrown mt-2">{data.bio || 'No bio provided'}</p>
              </div>
            </div>

            {/* College Information */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-300">
              <h3 className="text-2xl font-bold text-darkBrown mb-4">🏫 College Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-blue-200">
                  <p className="text-xs text-softBrown uppercase font-bold">College Name</p>
                  <p className="text-sm font-bold text-darkBrown mt-1">{data.college || 'N/A'}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-blue-200">
                  <p className="text-xs text-softBrown uppercase font-bold">Course / Branch</p>
                  <p className="text-sm font-bold text-darkBrown mt-1">{data.course || 'N/A'}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-blue-200">
                  <p className="text-xs text-softBrown uppercase font-bold">Year of Study</p>
                  <p className="text-sm font-bold text-darkBrown mt-1">{data.year || 'N/A'}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-blue-200">
                  <p className="text-xs text-softBrown uppercase font-bold">College Email</p>
                  <p className="text-sm font-bold text-darkBrown mt-1 break-all">{data.collegeEmail || 'N/A'}</p>
                </div>
              </div>
              <div className="mt-4 bg-white rounded-xl p-4 border border-blue-200">
                <p className="text-xs text-softBrown uppercase font-bold">Personal Email</p>
                <p className="text-sm font-bold text-darkBrown mt-1 break-all">{data.personalEmail || 'N/A'}</p>
              </div>
            </div>

            {/* Account Details */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-300">
              <h3 className="text-2xl font-bold text-darkBrown mb-4">✅ Account Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-green-200">
                  <p className="text-xs text-softBrown uppercase font-bold">Account Created</p>
                  <p className="text-sm font-bold text-darkBrown mt-1">{new Date(data.created_at).toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-green-200">
                  <p className="text-xs text-softBrown uppercase font-bold">Last Updated</p>
                  <p className="text-sm font-bold text-darkBrown mt-1">{new Date(data.updated_at || data.created_at).toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-green-200">
                  <p className="text-xs text-softBrown uppercase font-bold">Last Login</p>
                  <p className="text-sm font-bold text-darkBrown mt-1">{data.last_login ? new Date(data.last_login).toLocaleString() : 'Never'}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-green-200">
                  <p className="text-xs text-softBrown uppercase font-bold">Subscription Status</p>
                  <p className="text-sm font-bold text-darkBrown mt-1 uppercase">{data.subscription_status || 'None'}</p>
                </div>
              </div>
            </div>

            {/* Admin Notes & Status Info */}
            {(data.profile_admin_notes || data.rejected_reason || data.warnings_count) && (
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 border border-yellow-300">
                <h3 className="text-2xl font-bold text-darkBrown mb-4">📋 Admin Review Info</h3>
                <div className="space-y-3">
                  {data.profile_admin_notes && (
                    <div className="bg-white rounded-xl p-4 border border-yellow-200">
                      <p className="text-xs text-softBrown uppercase font-bold">Admin Notes</p>
                      <p className="text-sm text-darkBrown mt-1">{data.profile_admin_notes}</p>
                    </div>
                  )}
                  {data.rejected_reason && (
                    <div className="bg-white rounded-xl p-4 border border-red-200">
                      <p className="text-xs text-red-600 uppercase font-bold">❌ Rejection Reason</p>
                      <p className="text-sm text-red-700 mt-1">{data.rejected_reason}</p>
                    </div>
                  )}
                  {data.warnings_count > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-orange-200">
                      <p className="text-xs text-orange-600 uppercase font-bold">⚠️ Warning Count</p>
                      <p className="text-sm text-orange-700 mt-1">{data.warnings_count} warnings</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 pb-6">
              <button onClick={onClose} className="flex-1 btn-secondary">Close Panel</button>
            </div>

            {/* Raw Data - DEBUG */}
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 mt-6">
              <h3 className="text-lg font-bold text-white mb-3">🔍 Raw User Data (For Debug)</h3>
              <pre className="text-xs text-green-400 whitespace-pre-wrap break-all overflow-auto max-h-96 font-mono">{JSON.stringify(data, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isPaymentDetail) {
    const statusColor = data.status === 'approved' ? 'bg-green-500' : 
                        data.status === 'rejected' ? 'bg-red-500' :
                        data.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500';

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex justify-end overflow-hidden" onClick={onClose}>
        <div className="w-full max-w-2xl h-full bg-white shadow-2xl overflow-auto" onClick={(event) => event.stopPropagation()}>
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blushPink to-softPink p-6 flex justify-between items-center shadow-md">
            <h2 className="text-3xl font-bold text-white">💳 Payment Detail</h2>
            <button onClick={onClose} className="text-white text-3xl font-bold hover:scale-110 transition">✕</button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex gap-3 flex-wrap">
              <span className={`px-4 py-2 rounded-full text-white font-bold text-sm ${statusColor}`}>
                Status: {data.status?.toUpperCase() || 'UNKNOWN'}
              </span>
            </div>

            {/* User Information */}
            <div className="bg-gradient-to-br from-blushPink/10 to-softPink/10 rounded-2xl p-6 border border-softPink">
              <h3 className="text-2xl font-bold text-darkBrown mb-4">👤 User Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-softPink/30">
                  <p className="text-xs text-softBrown uppercase font-bold">Name</p>
                  <p className="text-sm font-bold text-darkBrown mt-1">{data.user_id?.name || data.name || 'N/A'}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-softPink/30">
                  <p className="text-xs text-softBrown uppercase font-bold">Email</p>
                  <p className="text-sm font-bold text-darkBrown mt-1 break-all">{data.user_id?.email || data.email || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-300">
              <h3 className="text-2xl font-bold text-darkBrown mb-4">💰 Payment Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-green-200">
                  <p className="text-xs text-softBrown uppercase font-bold">Plan</p>
                  <p className="text-sm font-bold text-darkBrown mt-1 capitalize">{data.plan || 'N/A'}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-green-200">
                  <p className="text-xs text-softBrown uppercase font-bold">Amount</p>
                  <p className="text-lg font-bold text-green-600 mt-1">₹{data.amount || '0'}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-green-200">
                  <p className="text-xs text-softBrown uppercase font-bold">Payment ID</p>
                  <p className="text-sm font-mono text-darkBrown mt-1 break-all">{data.payment_id || 'N/A'}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-green-200">
                  <p className="text-xs text-softBrown uppercase font-bold">Transaction ID</p>
                  <p className="text-sm font-mono text-darkBrown mt-1 break-all">{data._id || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Screenshot */}
            {data.screenshot_url && (
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-300">
                <h3 className="text-2xl font-bold text-darkBrown mb-4">📸 Payment Screenshot</h3>
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg border-2 border-purple-200">
                  {data.screenshot_url.startsWith('http') ? (
                    <img src={data.screenshot_url} alt="Payment Screenshot" className="w-full h-auto object-contain rounded-lg" />
                  ) : (
                    <div className="w-full h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <p className="text-gray-500 font-semibold">❌ Screenshot not available</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-300">
              <h3 className="text-2xl font-bold text-darkBrown mb-4">📅 Timeline</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-blue-200">
                  <p className="text-xs text-softBrown uppercase font-bold">Created</p>
                  <p className="text-sm font-bold text-darkBrown mt-1">{data.created_at ? new Date(data.created_at).toLocaleString() : 'N/A'}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-blue-200">
                  <p className="text-xs text-softBrown uppercase font-bold">Updated</p>
                  <p className="text-sm font-bold text-darkBrown mt-1">{data.updated_at ? new Date(data.updated_at).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 pb-6">
              <button onClick={onClose} className="flex-1 btn-secondary">Close Panel</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default view for other types
  return (
    <div className="fixed inset-0 bg-black/35 z-50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-2xl h-full bg-white border-l border-softPink/40 shadow-2xl p-5 overflow-auto" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-darkBrown">{title}</h3>
          <button className="text-softBrown hover:text-darkBrown text-lg" onClick={onClose}>✕</button>
        </div>
        <pre className="text-xs whitespace-pre-wrap break-all bg-creamyWhite p-3 rounded-xl border border-softPink/30">{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone = 'slate' }) {
  const toneClassMap = {
    slate: 'from-slate-500/18 to-slate-600/8 border-cyan-200/14',
    rose: 'from-rose-500/22 to-rose-600/8 border-rose-300/25',
    amber: 'from-amber-500/22 to-amber-600/8 border-amber-300/25',
    orange: 'from-orange-500/22 to-orange-600/8 border-orange-300/25',
    cyan: 'from-cyan-500/24 to-cyan-600/10 border-cyan-200/30',
    emerald: 'from-emerald-500/22 to-emerald-600/8 border-emerald-300/25'
  };

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${toneClassMap[tone] || toneClassMap.slate} p-4 shadow-[0_14px_40px_rgba(2,10,27,0.42)] backdrop-blur-xl`}>
      <p className="text-[11px] text-cyan-100/75 uppercase tracking-[0.16em]">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value || 0}</p>
    </div>
  );
}
