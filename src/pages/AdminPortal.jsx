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
  const NON_REFRESHABLE_SECTIONS = React.useMemo(() => new Set(['registration_approvals']), []);
  const ADMIN_FULL_CHAT_VIEW_REQUESTED = String(import.meta.env.VITE_ENABLE_ADMIN_FULL_CHAT_VIEW || '').toLowerCase() === 'true';

  const API_BASE_URL = getApiBaseUrl();
  const API_ROOT = String(API_BASE_URL || '').replace(/\/api$/i, '');
  const navigate = useNavigate();
  const { user, clearAuth } = useAuth();
  const { activeTheme } = useTheme();
  const [section, setSection] = React.useState('overview');
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
  const [userFilters, setUserFilters] = React.useState({ search: '', status: '', subscription: '' });
  const [paymentFilters, setPaymentFilters] = React.useState({ status: '', plan: '', from: '', to: '' });
  const [reportFilters, setReportFilters] = React.useState({ status: '', priority: '', targetType: '' });
  const [supportFilters, setSupportFilters] = React.useState({ status: '', priority: '' });
  const [manualRefreshEnabled, setManualRefreshEnabled] = React.useState(true);
  const [globalSearch, setGlobalSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [moderationFilter, setModerationFilter] = React.useState('all');
  const [dateRange, setDateRange] = React.useState('7d');
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
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    if (dateRange === '24h') return now - ts <= day;
    if (dateRange === '7d') return now - ts <= 7 * day;
    if (dateRange === '30d') return now - ts <= 30 * day;
    return true;
  }, [dateRange, toEpoch]);

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

  // Export data to CSV
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      notify('No data available to export', 'error');
      return;
    }
    
    try {
      // Get headers from first object
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(h => {
            const val = row[h];
            if (val === null || val === undefined) return '';
            if (typeof val === 'object') return JSON.stringify(val).replace(/"/g, '""');
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
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      notify('Failed to export CSV', 'error');
    }
  };

  // Development fallback mock data (uses real API in production)
  // Empty fallback data - no mock testing data
  const EMPTY_DATA = {
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
  };

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
        } catch (e) {
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
          // Backend returns { data: { data: users[], total, page, etc } } - extract the nested data
          const userData = response?.data?.data || response?.data?.users || [];
          console.log('👥 Users fetched:', userData.length, 'items');
          if (Array.isArray(userData)) {
            setUsers(userData);
          }
        } catch (e) {
          console.log('🔄 Loading users from backend...');
          setUsers(EMPTY_DATA.users);
        }
      }
      if (section === 'registration_approvals') {
        try {
          const response = await adminApi.getRegistrationApprovals();
          const users = response?.data?.data || response?.data || [];
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
          setApprovals(response?.data?.approvals || []);
        } catch (e) {
          setApprovals(EMPTY_DATA.approvals);
        }
      }
      if (section === 'matches') {
        try {
          const response = await Promise.race([
            adminApi.getMatches(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), API_TIMEOUT_MS))
          ]);
          setMatches(response?.data?.matches || []);
        } catch (e) {
          setMatches(EMPTY_DATA.matches);
        }
      }
      if (section === 'chat_monitoring') {
        try {
          let response;
          if (ADMIN_FULL_CHAT_VIEW_REQUESTED) {
            try {
              response = await Promise.race([
                adminApi.getFullViewChats(50, 150),
                new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), API_TIMEOUT_MS))
              ]);
              setChatVisibilityMode('full');
            } catch (fullViewError) {
              console.warn('Full chat test mode unavailable, using metadata mode:', fullViewError?.message || fullViewError);
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
        } catch (e) {
          setChatVisibilityMode('metadata');
          setChats(EMPTY_DATA.chats);
        }
      }
      if (section === 'payments') {
        try {
          const [response, settingsResponse] = await Promise.all([
            Promise.race([
              adminApi.getPayments(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), API_TIMEOUT_MS))
            ]),
            Promise.race([
              adminApi.getSettings(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), API_TIMEOUT_MS))
            ])
          ]);
          // Backend returns { data: { data: payments[] } } - extract the nested data
          const paymentData = response?.data?.data || response?.data || [];
          const settingsData = settingsResponse?.data?.data || settingsResponse?.data || [];
          console.log('💳 Payments fetched:', paymentData.length, 'items');
          setPayments(Array.isArray(paymentData) ? paymentData : []);
          setSettings(Array.isArray(settingsData) ? settingsData : []);
          
          // Calculate summary from payment data
          const summary = {
            totalRevenue: paymentData.reduce((sum, p) => sum + (p.amount || 0), 0),
            totalPayments: paymentData.length,
            approvedPayments: paymentData.filter(p => p.status === 'approved').length || 0,
            failedPayments: paymentData.filter(p => p.status === 'rejected').length || 0
          };
          setPaymentSummary(summary);
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
          setReports(response?.data?.reports || []);
        } catch (e) {
          setReports(EMPTY_DATA.reports);
        }
      }
      if (section === 'moderation') {
        try {
          const response = await Promise.race([
            adminApi.getModerationPhotos(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), API_TIMEOUT_MS))
          ]);
          setModerationPhotos(response?.data?.queue || []);
        } catch (e) {
          setModerationPhotos([]);
        }
      }
      if (section === 'colleges') {
        try {
          const response = await Promise.race([
            adminApi.getColleges(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), API_TIMEOUT_MS))
          ]);
          setColleges(response?.data?.colleges || []);
        } catch (e) {
          setColleges(EMPTY_DATA.colleges);
        }
      }
      if (section === 'support') {
        try {
          const response = await Promise.race([
            adminApi.getSupportTickets(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), API_TIMEOUT_MS))
          ]);
          setSupportTickets(response?.data?.tickets || []);
        } catch (e) {
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
        } catch (e) {
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
        } catch (e) {
          setSettings(EMPTY_DATA.settings);
        }
      }
      if (section === 'activity') {
        try {
          const response = await Promise.race([
            adminApi.getActivityLogs(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('API Timeout')), API_TIMEOUT_MS))
          ]);
          setActivity(response?.data?.activity || []);
        } catch (e) {
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
  }, [section, API_TIMEOUT_MS, ADMIN_FULL_CHAT_VIEW_REQUESTED]);

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

      const result = await response.json();
      
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

  const handleRegistrationApproval = async (userId, action) => {
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

    let reason = '';
    if (action === 'reject') {
      reason = window.prompt('Enter rejection reason:', 'Profile does not meet requirements') || '';
      if (!reason.trim()) {
        console.log('ℹ️ Rejection cancelled by admin');
        return;
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
        return;
      }

      console.log(`✅ User ${action}ed successfully!`);
      
      // Remove from pending list immediately
      const updated = registrationApprovals.filter(u => u._id !== userId);
      console.log(`📊 Updated pending approvals count: ${updated.length}`);
      setRegistrationApprovals(updated);
      
      notify(`User ${action}ed successfully.`);
      
    } catch (err) {
      console.error('❌ Error during approval:', err);
      console.error('❌ Error type:', err.constructor.name);
      console.error('❌ Error message:', err.message);
      console.error('❌ Full error:', err);
      notify(`Network error while processing approval: ${err.message}`, 'error');
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
                🛡️
              </div>
              <div>
                <h1 className="text-base font-bold tracking-wide text-white">CU DATERS OPS</h1>
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
                <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-100/65">CU DATERS / Admin / {visibleSections.find((s) => s.id === section)?.label || 'Overview'}</p>
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
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_160px_170px_190px] gap-3 items-center">
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
                  <option value="24h">Last 24h</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="all">All Time</option>
                </select>
              </div>

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
                {!loading && section === 'overview' ? <OverviewPanel overview={overview} users={filteredUsers} reports={filteredReports} chats={filteredChats} payments={filteredPayments} approvals={filteredRegistrationApprovals} onSectionChange={setSection} /> : null}
                {!loading && section === 'registration_approvals' ? <RegistrationApprovalsPanel registrations={filteredRegistrationApprovals} onApprove={handleRegistrationApproval} onOpenDetail={openDetailDrawer} /> : null}
                {!loading && section === 'users' ? <UsersPanel users={filteredUsers} onModerate={handleModerationAction} onDelete={handleDeleteUser} onOpenDetail={openDetailDrawer} onViewActivity={handleViewUserActivity} onNotify={notify} /> : null}
                {!loading && section === 'approvals' ? <ApprovalsPanel approvals={filteredApprovals} onApprove={handleApprovalAction} onOpenDetail={openDetailDrawer} /> : null}
                {!loading && section === 'matches' ? <MatchesPanel matches={filteredMatches} onOpenDetail={openDetailDrawer} /> : null}
                {!loading && section === 'chat_monitoring' ? <ChatsPanel chats={filteredChats} moderationFilter={moderationFilter} currentRole={userRole} onOpenDetail={openDetailDrawer} visibilityMode={chatVisibilityMode} /> : null}
                {!loading && section === 'payments' ? <PaymentsPanel payments={filteredPayments} summary={paymentSummary} onOpenDetail={openDetailDrawer} onRefresh={loadData} onUpdateSetting={handleUpdateSetting} settings={settings} adminPin={adminPin} onNotify={notify} /> : null}
                {!loading && section === 'reports' ? <ReportsPanel reports={filteredReports} onResolve={handleResolveReport} onOpenDetail={openDetailDrawer} /> : null}
                {!loading && section === 'moderation' ? <ModerationPanel photos={moderationPhotos} /> : null}
                {!loading && section === 'colleges' ? <CollegesPanel colleges={colleges} /> : null}
                {!loading && section === 'support' ? <SupportPanel tickets={filteredSupportTickets} /> : null}
                {!loading && section === 'analytics' ? <AnalyticsPanel analytics={analytics} /> : null}
                {!loading && section === 'settings' ? <SettingsPanel settings={settings} onUpdate={handleUpdateSetting} /> : null}
                {!loading && section === 'activity' ? <ActivityPanel logs={filteredActivity} /> : null}
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

function OverviewPanel({ overview, users = [], reports = [], chats = [], payments = [], approvals = [], onSectionChange }) {
  const totalUsers = Number(overview?.totalUsers || users.length || 0);
  const activeToday = Number(overview?.activeToday || overview?.activeUsers || 0);
  const newRegistrations = Number(overview?.newRegistrations || 0);
  const pendingRegistrationApprovals = Number(overview?.pendingRegistrationApprovals || approvals.length || 0);
  const pendingProfileApprovals = Number(overview?.pendingProfileApprovals || overview?.pendingApprovals || 0);
  const activeReports = Number(overview?.activeReports || reports.filter((report) => report.status !== 'resolved').length || 0);
  const flaggedChats = Number(overview?.flaggedChats || chats.filter((chat) => Number(chat.riskScore || 0) >= 65 || Number(chat.reportCount || 0) > 0).length || 0);
  const suspiciousUsers = Number(overview?.suspiciousUsers || users.filter((user) => Number(user.warnings_count || 0) > 1 || user.status === 'banned').length || 0);
  const blockedAccounts = Number(overview?.blockedAccounts || users.filter((user) => ['banned', 'suspended'].includes(user.status)).length || 0);
  const premiumUsers = Number(overview?.premiumUsers || overview?.activeSubscriptions || 0);
  const monthlyRevenue = Number(overview?.monthlyRevenue || overview?.totalRevenue || 0);
  const pendingPaymentReviews = Number(overview?.pendingPaymentReviews || payments.filter((payment) => payment.status === 'pending').length || 0);

  const systemHealth = overview?.systemHealth || {};
  const recentActivity = overview?.recentActivity || [];
  const notices = overview?.platformAlerts || [];
  const liveQueue = [
    { label: 'Registration Queue', value: pendingRegistrationApprovals, section: 'registration_approvals' },
    { label: 'Profile Queue', value: pendingProfileApprovals, section: 'approvals' },
    { label: 'Payment Queue', value: pendingPaymentReviews, section: 'payments' },
    { label: 'Reports Queue', value: activeReports, section: 'reports' }
  ];

  const statCards = [
    { label: 'Total Users', value: totalUsers, icon: '👥', hint: 'All registered accounts', tone: 'info' },
    { label: 'Active Today', value: activeToday, icon: '🟢', hint: 'Engaged in last 24h', tone: 'success' },
    { label: 'New Registrations', value: newRegistrations, icon: '🆕', hint: 'Created in last 24h', tone: 'info' },
    { label: 'Pending Registration', value: pendingRegistrationApprovals, icon: '📝', hint: 'Awaiting admin decision', tone: 'warning' },
    { label: 'Pending Profile Approvals', value: pendingProfileApprovals, icon: '✅', hint: 'Verification queue', tone: 'warning' },
    { label: 'Active Reports', value: activeReports, icon: '🚩', hint: 'Open moderation cases', tone: 'danger' },
    { label: 'Flagged Chats', value: flaggedChats, icon: '🛡️', hint: 'Safety signal triggered', tone: 'warning' },
    { label: 'Suspicious Users', value: suspiciousUsers, icon: '🕵️', hint: 'Marked for review', tone: 'danger' },
    { label: 'Blocked Accounts', value: blockedAccounts, icon: '⛔', hint: 'Restricted users', tone: 'danger' },
    { label: 'Premium Users', value: premiumUsers, icon: '⭐', hint: 'Active premium members', tone: 'success' },
    { label: 'Monthly Revenue', value: `INR ${monthlyRevenue.toLocaleString('en-IN')}`, icon: '💰', hint: 'Current month approved', tone: 'success' },
    { label: 'Pending Payment Reviews', value: pendingPaymentReviews, icon: '💳', hint: 'Needs finance action', tone: 'warning' }
  ];

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
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

      <div className="grid xl:grid-cols-[1.3fr_1fr] gap-4">
        <PremiumSurface
          title="Operational Trend Summary"
          subtitle="Realtime pulse of approvals, moderation, and growth"
          rightSlot={<StatusChip tone="info">Live Snapshot</StatusChip>}
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-cyan-200/15 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-wide text-[color:var(--portal-muted)]">Verification velocity</p>
              <p className="text-lg font-semibold text-[color:var(--text-light)] mt-1">{pendingProfileApprovals === 0 ? 'Queue clear' : `${pendingProfileApprovals} pending`}</p>
            </div>
            <div className="rounded-xl border border-cyan-200/15 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-wide text-[color:var(--portal-muted)]">Moderation pressure</p>
              <p className="text-lg font-semibold text-[color:var(--text-light)] mt-1">{activeReports > 0 ? `${activeReports} active cases` : 'No open incidents'}</p>
            </div>
            <div className="rounded-xl border border-cyan-200/15 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-wide text-[color:var(--portal-muted)]">Revenue momentum</p>
              <p className="text-lg font-semibold text-[color:var(--text-light)] mt-1">INR {monthlyRevenue.toLocaleString('en-IN')}</p>
            </div>
            <div className="rounded-xl border border-cyan-200/15 bg-white/5 p-3">
              <p className="text-xs uppercase tracking-wide text-[color:var(--portal-muted)]">Premium conversion</p>
              <p className="text-lg font-semibold text-[color:var(--text-light)] mt-1">{totalUsers > 0 ? `${Math.round((premiumUsers / totalUsers) * 100)}%` : '0%'} premium users</p>
            </div>
          </div>
        </PremiumSurface>

        <PremiumSurface title="System Health" subtitle="Core platform services">
          <div className="space-y-2">
            {[
              { label: 'API', value: systemHealth.api || 'healthy' },
              { label: 'Database', value: systemHealth.database || 'healthy' },
              { label: 'Payments', value: systemHealth.payments || 'degraded' },
              { label: 'Storage', value: systemHealth.storage || 'healthy' }
            ].map((item) => {
              const tone = item.value === 'healthy' ? 'success' : item.value === 'degraded' ? 'warning' : 'danger';
              return (
                <div key={item.label} className="flex items-center justify-between rounded-xl border border-cyan-200/15 bg-white/5 px-3 py-2">
                  <span className="text-sm text-[color:var(--text-light)]">{item.label}</span>
                  <StatusChip tone={tone}>{item.value}</StatusChip>
                </div>
              );
            })}
          </div>
        </PremiumSurface>
      </div>

      <div className="grid xl:grid-cols-[1.1fr_1fr_1fr] gap-4">
        <PremiumSurface title="Recent Admin Activity" subtitle="Latest governance actions">
          {recentActivity.length ? (
            <div className="space-y-2.5">
              {recentActivity.slice(0, 8).map((entry, idx) => (
                <div key={entry._id || idx} className="rounded-xl border border-cyan-200/15 bg-white/5 px-3 py-2.5">
                  <p className="text-sm text-[color:var(--text-light)]">{entry.description || entry.action || 'Activity update'}</p>
                  <p className="text-xs text-[color:var(--portal-muted)] mt-1">{new Date(entry.timestamp || entry.createdAt || Date.now()).toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-cyan-200/15 bg-white/5 px-3 py-4 text-sm text-[color:var(--portal-muted)]">No recent admin actions. Activity will appear as the team starts reviewing queues.</div>
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
            <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-200">No critical safety alerts right now. Monitoring remains active.</div>
          )}
        </PremiumSurface>

        <PremiumSurface title="Quick Actions" subtitle="High-impact admin shortcuts">
          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={() => onSectionChange?.('registration_approvals')} className="rounded-xl border border-cyan-200/20 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs text-[color:var(--text-light)]">Open Registration Queue</button>
            <button onClick={() => onSectionChange?.('approvals')} className="rounded-xl border border-cyan-200/20 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs text-[color:var(--text-light)]">Review Profiles</button>
            <button onClick={() => onSectionChange?.('reports')} className="rounded-xl border border-cyan-200/20 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs text-[color:var(--text-light)]">Resolve Reports</button>
            <button onClick={() => onSectionChange?.('payments')} className="rounded-xl border border-cyan-200/20 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs text-[color:var(--text-light)]">Approve Payments</button>
            <button onClick={() => onSectionChange?.('users')} className="rounded-xl border border-cyan-200/20 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs text-[color:var(--text-light)]">User Directory</button>
            <button onClick={() => onSectionChange?.('settings')} className="rounded-xl border border-cyan-200/20 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs text-[color:var(--text-light)]">Platform Settings</button>
          </div>
        </PremiumSurface>
      </div>

      <PremiumSurface title="Live Queue Panel" subtitle="Operational backlog and throughput">
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {liveQueue.map((queue) => (
            <button
              key={queue.label}
              onClick={() => onSectionChange?.(queue.section)}
              className="text-left rounded-xl border border-cyan-200/20 bg-white/5 hover:bg-white/10 px-4 py-3"
            >
              <p className="text-xs uppercase tracking-wide text-[color:var(--portal-muted)]">{queue.label}</p>
              <p className="text-2xl font-semibold text-[color:var(--text-light)] mt-1">{queue.value}</p>
              <p className="text-xs text-cyan-200 mt-1">Open queue</p>
            </button>
          ))}
        </div>
      </PremiumSurface>
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

function RegistrationApprovalsPanel({ registrations, onApprove, onOpenDetail }) {
  if (!registrations || registrations.length === 0) {
    return (
      <div className="card bg-green-50 border-2 border-green-300 text-center p-8">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-2xl font-bold text-green-900 mb-2">All Clear!</h2>
        <p className="text-green-700">No pending registrations to approve.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
        <h3 className="text-lg font-bold text-yellow-900 mb-4 flex items-center gap-2">
          ⏳ Pending Registrations ({registrations.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-yellow-200">
                <th className="text-left py-3 px-4 font-bold text-yellow-900">Name</th>
                <th className="text-left py-3 px-4 font-bold text-yellow-900">Email</th>
                <th className="text-left py-3 px-4 font-bold text-yellow-900">Phone</th>
                <th className="text-left py-3 px-4 font-bold text-yellow-900">Course</th>
                <th className="text-left py-3 px-4 font-bold text-yellow-900">Submitted</th>
                <th className="text-left py-3 px-4 font-bold text-yellow-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((user) => (
                <tr key={user._id} className="border-b border-yellow-100 hover:bg-yellow-100/50">
                  <td className="py-3 px-4 font-semibold">{user.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{user.email || user.collegeEmail || user.personalEmail}</td>
                  <td className="py-3 px-4 text-sm">{user.phone}</td>
                  <td className="py-3 px-4 text-sm">{user.course}</td>
                  <td className="py-3 px-4 text-xs text-gray-600">
                    {new Date(user.created_at || user.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => onOpenDetail('Registration Detail', user)}
                        className="text-xs px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        Detail
                      </button>
                      <button
                        onClick={() => onApprove(user._id, 'approve')}
                        className="text-xs px-3 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 font-semibold"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => onApprove(user._id, 'reject')}
                        className="text-xs px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 font-semibold"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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

  const isFullViewMode = visibilityMode === 'full';

  const canReviewContent = currentRole === 'super_admin' || currentRole === 'moderator';

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

  const openThreadViewer = (chat) => {
    const participantMap = new Map((chat.participants || []).map((participant) => [String(participant?._id), participant?.name || 'Unknown']));
    const normalizedMessages = Array.isArray(chat.messages)
      ? chat.messages.map((message) => ({
          ...message,
          senderLabel: participantMap.get(String(message.senderId)) || 'User'
        }))
      : [];

    setThreadViewer({
      ...chat,
      participantNames: chat.participantNames,
      messages: normalizedMessages
    });
  };

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
          Open Thread
        </button>
      ) : (
        <button className={`text-xs px-2 py-1 rounded-lg ${chat.eligibleForDeepReview ? 'bg-fuchsia-500/25 border border-fuchsia-300/35 text-fuchsia-100' : 'bg-white/5 border border-white/10 text-slate-400 cursor-not-allowed'}`} disabled={!chat.eligibleForDeepReview} onClick={() => requestContentAccess(chat)}>
          Review
        </button>
      )}
    </div>
  ]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        {isFullViewMode
          ? 'Test mode notice: full conversation visibility is enabled for moderation QA/demo. Disable ENABLE_ADMIN_FULL_CHAT_VIEW to instantly restore metadata-only mode.'
          : 'Privacy notice: full conversation content is hidden by default. Access is allowed only for flagged/reported conversations with authorized role and auditable reason.'}
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <MetricCard label="Harassment Flags" value={queueStats.harassment} tone="rose" />
        <MetricCard label="Suspicious Links" value={queueStats.suspiciousLinks} tone="amber" />
        <MetricCard label="Repeated Spam" value={queueStats.spam} tone="orange" />
        <MetricCard label="Under Review" value={queueStats.underReview} tone="cyan" />
        <MetricCard label="Resolved Cases" value={queueStats.resolved} tone="emerald" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-slate-900/55 px-4 py-3">
        <div className="text-sm text-slate-300">Bulk actions for selected conversations ({selectedIds.length})</div>
        <div className="flex gap-2">
          <button disabled={!selectedIds.length} onClick={() => runBulkStatusUpdate('reviewing')} className="px-3 py-1.5 text-xs rounded-lg bg-cyan-500/20 border border-cyan-300/30 disabled:opacity-40">Mark Reviewing</button>
          <button disabled={!selectedIds.length} onClick={() => runBulkStatusUpdate('action_taken')} className="px-3 py-1.5 text-xs rounded-lg bg-amber-500/20 border border-amber-300/30 disabled:opacity-40">Action Taken</button>
          <button disabled={!selectedIds.length} onClick={() => runBulkStatusUpdate('resolved')} className="px-3 py-1.5 text-xs rounded-lg bg-emerald-500/20 border border-emerald-300/30 disabled:opacity-40">Resolve</button>
        </div>
      </div>

      <TablePanel
        title={isFullViewMode ? 'Conversation Safety Queue (Full Thread Test Mode)' : 'Conversation Safety Queue'}
        columns={['Participants', 'Messages', 'Risk', 'Reports', 'Blocked', 'Last Activity', 'Case Status', 'Actions']}
        rows={tableRows}
        pageSize={12}
      />

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
    upiId: billingValue.upiId || '',
    offerText: billingValue.offerText || '',
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
      upiId: billingValue.upiId || prev.upiId,
      offerText: billingValue.offerText || prev.offerText,
      couponCode: billingValue.couponCode || '',
      couponDiscountPct: Number(billingValue.couponDiscountPct) || 0
    }));
  }, [billingValue.couponCode, billingValue.couponDiscountPct, billingValue.couponsEnabled, billingValue.disableFreeMode, billingValue.maxActiveMatches, billingValue.maxMessagesPerDay, billingValue.maxRequestsPerDay, billingValue.monthlyPrice, billingValue.offerText, billingValue.premiumFree, billingValue.premiumPrice, billingValue.qrEnabled, billingValue.upiEnabled, billingValue.upiId]);

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
        upiId: String(billingDraft.upiId || '').trim(),
        offerText: String(billingDraft.offerText || '').trim(),
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
  const pendingPayments = payments?.filter(p => p.status === 'pending') || [];
  const approvedPayments = payments?.filter(p => p.status === 'approved') || [];
  const rejectedPayments = payments?.filter(p => p.status === 'rejected') || [];

  return (
    <div className="space-y-6">
      <div className="grid xl:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-cyan-200/15 bg-[#0a1a36]/58 p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">2-Tier Pricing and Payment Controls</h3>
            <button onClick={persistBillingConfig} disabled={savingConfig} className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-semibold disabled:opacity-60">
              {savingConfig ? 'Saving...' : 'Save Controls'}
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-2 mb-3">
            <label className="text-xs text-slate-300">Premium Price (INR)
              <input type="number" value={billingDraft.premiumPrice} onChange={(event) => setBillingDraft((prev) => ({ ...prev, premiumPrice: event.target.value }))} className="mt-1 w-full rounded-lg bg-white/10 border border-cyan-200/20 px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs text-slate-300">Free Plan Price
              <input type="number" value={0} disabled className="mt-1 w-full rounded-lg bg-white/10 border border-cyan-200/20 px-2 py-1.5 text-sm opacity-70" />
            </label>
          </div>
          <div className="grid sm:grid-cols-3 gap-2 mb-3">
            <label className="text-xs text-slate-300">Free messages/day
              <input type="number" value={billingDraft.maxMessagesPerDay} onChange={(event) => setBillingDraft((prev) => ({ ...prev, maxMessagesPerDay: event.target.value }))} className="mt-1 w-full rounded-lg bg-white/10 border border-cyan-200/20 px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs text-slate-300">Free active matches
              <input type="number" value={billingDraft.maxActiveMatches} onChange={(event) => setBillingDraft((prev) => ({ ...prev, maxActiveMatches: event.target.value }))} className="mt-1 w-full rounded-lg bg-white/10 border border-cyan-200/20 px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs text-slate-300">Free requests/day
              <input type="number" value={billingDraft.maxRequestsPerDay} onChange={(event) => setBillingDraft((prev) => ({ ...prev, maxRequestsPerDay: event.target.value }))} className="mt-1 w-full rounded-lg bg-white/10 border border-cyan-200/20 px-2 py-1.5 text-sm" />
            </label>
          </div>
          <div className="grid sm:grid-cols-3 gap-2 mb-3">
            <label className="text-xs text-slate-300 flex items-center gap-2"><input type="checkbox" checked={billingDraft.upiEnabled} onChange={(event) => setBillingDraft((prev) => ({ ...prev, upiEnabled: event.target.checked }))} />UPI enabled</label>
            <label className="text-xs text-slate-300 flex items-center gap-2"><input type="checkbox" checked={billingDraft.qrEnabled} onChange={(event) => setBillingDraft((prev) => ({ ...prev, qrEnabled: event.target.checked }))} />QR enabled</label>
            <label className="text-xs text-slate-300 flex items-center gap-2"><input type="checkbox" checked={billingDraft.couponsEnabled} onChange={(event) => setBillingDraft((prev) => ({ ...prev, couponsEnabled: event.target.checked }))} />Coupons enabled</label>
          </div>
          <div className="grid sm:grid-cols-2 gap-2 mb-3">
            <label className="text-xs text-slate-300 flex items-center gap-2"><input type="checkbox" checked={billingDraft.premiumFree} onChange={(event) => setBillingDraft((prev) => ({ ...prev, premiumFree: event.target.checked }))} />Premium for everyone</label>
            <label className="text-xs text-slate-300 flex items-center gap-2"><input type="checkbox" checked={billingDraft.disableFreeMode} onChange={(event) => setBillingDraft((prev) => ({ ...prev, disableFreeMode: event.target.checked }))} />Disable free mode</label>
          </div>
          <div className="grid sm:grid-cols-2 gap-2 mb-3">
            <label className="text-xs text-slate-300">UPI ID
              <input value={billingDraft.upiId} onChange={(event) => setBillingDraft((prev) => ({ ...prev, upiId: event.target.value }))} placeholder="name@bank" className="mt-1 w-full rounded-lg bg-white/10 border border-cyan-200/20 px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs text-slate-300">Offer text
              <input value={billingDraft.offerText} onChange={(event) => setBillingDraft((prev) => ({ ...prev, offerText: event.target.value }))} placeholder="Limited time offer" className="mt-1 w-full rounded-lg bg-white/10 border border-cyan-200/20 px-2 py-1.5 text-sm" />
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <label className="text-xs text-slate-300">Coupon code
              <input value={billingDraft.couponCode} onChange={(event) => setBillingDraft((prev) => ({ ...prev, couponCode: event.target.value }))} placeholder="WELCOME20" className="mt-1 w-full rounded-lg bg-white/10 border border-cyan-200/20 px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs text-slate-300">Discount %
              <input type="number" min="0" max="95" value={billingDraft.couponDiscountPct} onChange={(event) => setBillingDraft((prev) => ({ ...prev, couponDiscountPct: event.target.value }))} className="mt-1 w-full rounded-lg bg-white/10 border border-cyan-200/20 px-2 py-1.5 text-sm" />
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-200/15 bg-[#0a1a36]/58 p-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-3">Membership Operations</h3>
          <div className="grid sm:grid-cols-2 gap-2 mb-2">
            <input value={membershipAction.userId} onChange={(event) => setMembershipAction((prev) => ({ ...prev, userId: event.target.value }))} placeholder="User ID" className="rounded-lg bg-white/10 border border-cyan-200/20 px-2 py-1.5 text-sm" />
            <select value={membershipAction.action} onChange={(event) => setMembershipAction((prev) => ({ ...prev, action: event.target.value }))} className="rounded-lg bg-white/10 border border-cyan-200/20 px-2 py-1.5 text-sm">
              <option value="grant">Grant</option>
              <option value="extend">Extend</option>
              <option value="revoke">Revoke</option>
            </select>
          </div>
          <div className="grid sm:grid-cols-3 gap-2 mb-2">
            <select value={membershipAction.plan} onChange={(event) => setMembershipAction((prev) => ({ ...prev, plan: event.target.value }))} className="rounded-lg bg-white/10 border border-cyan-200/20 px-2 py-1.5 text-sm">
              <option value="Premium">Premium</option>
            </select>
            <input type="number" value={membershipAction.durationDays} onChange={(event) => setMembershipAction((prev) => ({ ...prev, durationDays: event.target.value }))} placeholder="Days" className="rounded-lg bg-white/10 border border-cyan-200/20 px-2 py-1.5 text-sm" />
            <input type="number" value={membershipAction.amount} onChange={(event) => setMembershipAction((prev) => ({ ...prev, amount: event.target.value }))} placeholder="Amount" className="rounded-lg bg-white/10 border border-cyan-200/20 px-2 py-1.5 text-sm" />
          </div>
          <textarea value={membershipAction.note} onChange={(event) => setMembershipAction((prev) => ({ ...prev, note: event.target.value }))} placeholder="Audit note (optional)" rows={2} className="w-full rounded-lg bg-white/10 border border-cyan-200/20 px-2 py-1.5 text-sm mb-2" />
          <button onClick={runMembershipAction} disabled={runningMembershipAction} className="w-full px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60">
            {runningMembershipAction ? 'Applying...' : 'Apply Membership Action'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-3">
        <MetricCard label="Total Revenue" value={`₹${summary?.totalRevenue || 0}`} />
        <MetricCard label="All Payments" value={summary?.totalPayments || 0} />
        <MetricCard label="✅ Approved" value={summary?.approvedPayments || 0} />
        <MetricCard label="⏳ Pending" value={pendingPayments.length} />
      </div>

      {/* Export Button */}
      <div className="flex gap-2">
        <button
          onClick={exportPayments}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium"
        >
          📥 Export Payments to CSV
        </button>
      </div>

      {/* Pending Payments - Priority Section */}
      {pendingPayments.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6">
          <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
            ⏳ Pending Approvals ({pendingPayments.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-amber-200">
                  <th className="text-left py-2 px-3 font-bold text-amber-900">User</th>
                  <th className="text-left py-2 px-3 font-bold text-amber-900">Plan</th>
                  <th className="text-left py-2 px-3 font-bold text-amber-900">Amount</th>
                  <th className="text-left py-2 px-3 font-bold text-amber-900">Payment ID</th>
                  <th className="text-left py-2 px-3 font-bold text-amber-900">Submitted</th>
                  <th className="text-left py-2 px-3 font-bold text-amber-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.map((payment) => (
                  <tr key={payment._id} className="border-b border-amber-100 hover:bg-amber-100/50">
                    <td className="py-3 px-3">{payment.user_id?.name || payment.userName || '-'}</td>
                    <td className="py-3 px-3 font-semibold text-pink-600">{payment.plan || payment.planName}</td>
                    <td className="py-3 px-3 font-bold">₹{payment.amount}</td>
                    <td className="py-3 px-3 font-mono text-xs bg-white rounded p-1">{payment.payment_id}</td>
                    <td className="py-3 px-3 text-xs text-gray-600">
                      {new Date(payment.created_at || payment.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handlePaymentAction(payment._id, 'approve')}
                          className="text-xs px-3 py-1 rounded bg-green-500 text-white hover:bg-green-600 transition font-bold"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => handlePaymentAction(payment._id, 'reject')}
                          className="text-xs px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition font-bold"
                        >
                          ❌ Reject
                        </button>
                        <button
                          onClick={() => onOpenDetail('Payment Detail', payment)}
                          className="text-xs px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition font-bold"
                        >
                          👁️ View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approved Payments */}
      {approvedPayments.length > 0 && (
        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
          <h3 className="text-lg font-bold text-green-900 mb-4">✅ Approved ({approvedPayments.length})</h3>
          <TablePanel
            columnClassName="text-xs"
            columns={['User', 'Plan', 'Amount', 'Payment ID', 'Approved At']}
            rows={approvedPayments.map((p) => [
              p.user_id?.name || p.userName || '-',
              p.plan || p.planName,
              `₹${p.amount}`,
              p.payment_id || p.paymentId || '-',
              new Date(p.approved_at || p.approvedAt).toLocaleString()
            ])}
            pageSize={5}
          />
        </div>
      )}

      {/* Rejected Payments */}
      {rejectedPayments.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
          <h3 className="text-lg font-bold text-red-900 mb-4">❌ Rejected ({rejectedPayments.length})</h3>
          <TablePanel
            columnClassName="text-xs"
            columns={['User', 'Plan', 'Amount', 'Payment ID', 'Rejected At']}
            rows={rejectedPayments.map((p) => [
              p.user_id?.name || p.userName || '-',
              p.plan || p.planName,
              `₹${p.amount}`,
              p.payment_id || p.paymentId || '-',
              new Date(p.rejected_at || p.rejectedAt).toLocaleString()
            ])}
            pageSize={5}
          />
        </div>
      )}

      {/* Empty State */}
      {(!payments || payments.length === 0) && (
        <div className="text-center py-12 bg-white rounded-xl border-2 border-gray-200">
          <p className="text-3xl mb-2">💳</p>
          <p className="text-gray-600 text-lg font-semibold">No payments yet</p>
          <p className="text-gray-500 text-sm mt-1">Payment requests will appear here</p>
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
  return <TablePanel title="Campus Management" columns={['College', 'Domain', 'Active', 'Verification', 'Onboarding']} rows={colleges.map((college) => [
    college.name,
    college.domain,
    college.is_active ? 'Yes' : 'No',
    college.verification_required ? 'Required' : 'Optional',
    college.onboarding_enabled ? 'Enabled' : 'Disabled'
  ])} />;
}

function SupportPanel({ tickets }) {
  return <TablePanel title="Support and Operations" columns={['Subject', 'User', 'Priority', 'Status', 'Updated']} rows={tickets.map((ticket) => [
    ticket.subject,
    ticket.user_id?.email || '-',
    ticket.priority,
    ticket.status,
    new Date(ticket.updated_at || ticket.created_at).toLocaleString()
  ])} />;
}

function AnalyticsPanel({ analytics }) {
  if (!analytics) {
    return <p className="text-softBrown">No analytics data available.</p>;
  }

  const bars = [
    ['DAU', analytics.dailyActiveUsers],
    ['WAU', analytics.weeklyActiveUsers],
    ['MAU', analytics.monthlyActiveUsers],
    ['Signups', analytics.newSignups],
    ['Messages', analytics.messageActivity]
  ];

  const maxValue = Math.max(...bars.map((item) => Number(item[1]) || 0), 1);

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-3">
        <MetricCard label="DAU" value={analytics.dailyActiveUsers} />
        <MetricCard label="WAU" value={analytics.weeklyActiveUsers} />
        <MetricCard label="MAU" value={analytics.monthlyActiveUsers} />
        <MetricCard label="New Signups" value={analytics.newSignups} />
        <MetricCard label="Premium Conversion" value={`${analytics.premiumConversionRate}%`} />
        <MetricCard label="Match Rate" value={`${analytics.matchRate}%`} />
        <MetricCard label="Message Activity" value={analytics.messageActivity} />
        <MetricCard label="Retention Indicator" value={`${analytics.retentionHint}%`} />
      </div>

      <div className="rounded-2xl border border-softPink/40 bg-white p-4">
        <p className="font-bold text-darkBrown mb-3">Engagement Trend Snapshot</p>
        <div className="space-y-2">
          {bars.map(([label, value]) => (
            <div key={label}>
              <div className="flex justify-between text-xs text-softBrown mb-1">
                <span>{label}</span>
                <span>{value || 0}</span>
              </div>
              <div className="h-2 rounded-full bg-softPink/40 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blushPink to-softPink" style={{ width: `${Math.max(6, ((Number(value) || 0) / maxValue) * 100)}%` }}></div>
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

  return (
    <div className="space-y-4">
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
  return <TablePanel title="Operational Audit Trail" columns={['Action', 'Status', 'Actor', 'Time']} rows={logs.map((log) => [
    log.action,
    log.status,
    log.admin_id?.email || log.user_id?.email || '-',
    new Date(log.timestamp).toLocaleString()
  ])} />;
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
