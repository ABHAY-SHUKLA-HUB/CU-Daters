import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import EnhancedProfileCard from '../components/EnhancedProfileCard';
import EnhancedMatchPopup from '../components/EnhancedMatchPopup';
import EmotionalFeedbackLayer from '../components/EmotionalFeedbackLayer';
import BottomNav from '../components/BottomNav';
import RecentMatches from '../components/RecentMatches';
import LikeRequests from '../components/LikeRequests';
import GenderFilterToggle from '../components/GenderFilterToggle';
import { DiscoverCardSkeleton } from '../components/DiscoverCardSkeleton';
import chatApi from '../services/chatApi';
import likesApi from '../services/likesApi';
import connectionApi from '../services/connectionApi';
import { resolvePublicProfileVisual } from '../utils/profileMedia';
import { useNotificationSocket } from '../hooks/useNotificationSocket';
import { useDiscoverProfileCache } from '../hooks/useDiscoverProfileCache';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Error Boundary Component
class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  // eslint-disable-next-line no-unused-vars
  componentDidCatch(_error, _errorInfo) {
    // Log error if needed
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-creamyWhite">
          <h2 className="text-2xl text-red-600 font-bold mb-4">Something went wrong in Dashboard!</h2>
          <p className="text-softBrown mb-2">{this.state.error?.toString()}</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser, clearAuth } = useAuth();
  const { themes, activeTheme, setTheme } = useTheme();
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [profilePage, setProfilePage] = useState(1);
  const [showThemeOptions, setShowThemeOptions] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'discover');
  const [likedProfiles, setLikedProfiles] = useState([]);
  const [serverMatches, setServerMatches] = useState([]);
  const [connections, setConnections] = useState([]);
  const [connectionsSearch, setConnectionsSearch] = useState('');
  const [allProfiles, setAllProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingLikes, setPendingLikes] = useState([]);
  const [likeNotification, setLikeNotification] = useState(null);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [activeConversationCount, setActiveConversationCount] = useState(0);
  const [emotionCue, setEmotionCue] = useState(null);
  const [matchPopupData, setMatchPopupData] = useState(null);
  
  // Premium discover experience enhancements
  const [genderFilter, setGenderFilter] = useState('both');
  const [userPreferredGender, setUserPreferredGender] = useState('both');
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState(null);
  
  // Initialize discover profile cache hook
  const {
    fetchProfilesWithCache,
    prefetchNextProfiles,
    invalidateCache
  } = useDiscoverProfileCache();

  const triggerEmotion = React.useCallback((type, label = '') => {
    setEmotionCue({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      label
    });
  }, []);

  const refreshIncomingRequests = React.useCallback(async () => {
    try {
      const response = await connectionApi.getIncomingRequests();
      setPendingLikes(response?.data?.requests || []);
    } catch (err) {
      console.error('Error refreshing incoming requests:', err);
    }
  }, []);

  const themeSections = React.useMemo(() => {
    const byId = themes.reduce((acc, theme) => {
      acc[theme.id] = theme;
      return acc;
    }, {});

    const pickThemes = (ids) => ids.map((id) => byId[id]).filter(Boolean);

    return [
      {
        id: 'light',
        icon: '🌸',
        title: 'Light Themes',
        subtitle: 'Bright, soft and calming looks',
        items: pickThemes(['soft-rose', 'cream-dream', 'lavender-blush'])
      },
      {
        id: 'dark',
        icon: '🌙',
        title: 'Dark Themes',
        subtitle: 'Low-light comfortable viewing',
        items: pickThemes(['warm-night', 'midnight-glass'])
      },
      {
        id: 'premium',
        icon: '✨',
        title: 'Premium Themes',
        subtitle: 'Signature styles with bold personality',
        items: pickThemes(['romantic-gradient', 'gold-luxury', 'vibrant-genz'])
      }
    ];
  }, [themes]);

  const setTab = React.useCallback((tab) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Fetch profiles from discover endpoint
  React.useEffect(() => {
    const requestedTab = searchParams.get('tab');
    if (requestedTab && requestedTab !== activeTab) {
      setActiveTab(requestedTab);
    }
  }, [activeTab, searchParams]);

  const normalizeDiscoverErrorMessage = React.useCallback((error) => {
    const rawMessage = String(error?.message || '').toLowerCase();
    if (rawMessage.includes('timeout')) {
      return 'Discover is taking longer than expected. Tap Retry to load a lighter queue.';
    }
    if (rawMessage.includes('network') || rawMessage.includes('failed to fetch')) {
      return 'Network looks unstable right now. Please retry discover.';
    }
    return error?.message || 'Failed to load profiles. Please try again.';
  }, []);

  // Enhanced fetch with caching and gender filtering
  const fetchProfiles = React.useCallback(async (filterGender = genderFilter) => {
    try {
      setIsLoadingProfiles(true);
      setProfileLoadError(null);
      setError('');
      let data;
      try {
        // Use optimized cache-aware fetch with gender filter
        data = await fetchProfilesWithCache(1, 24, filterGender, {
          lite: true,
          skipCache: false
        });
      } catch (primaryError) {
        // Automatic fallback: fetch a smaller queue
        try {
          data = await fetchProfilesWithCache(1, 12, filterGender, {
            lite: true,
            skipCache: true
          });
          setLikeNotification('Recovered on quick mode. Showing a lighter discover queue.');
          window.setTimeout(() => setLikeNotification(null), 2600);
        } catch (fallbackError) {
          throw primaryError;
        }

        if (!data?.profiles?.length) {
          throw primaryError;
        }
      }

      setAllProfiles(data.profiles || []);
      setCurrentProfileIndex(0);
      
      // Store user's default preference from API response
      if (data.defaultPreference) {
        setUserPreferredGender(data.defaultPreference);
      }
      
      // Prefetch next profiles in background for smooth experience
      prefetchNextProfiles(2, filterGender);
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setProfileLoadError(normalizeDiscoverErrorMessage(err));
      setError(normalizeDiscoverErrorMessage(err));
    } finally {
      setIsLoadingProfiles(false);
    }
  }, [genderFilter, fetchProfilesWithCache, prefetchNextProfiles, normalizeDiscoverErrorMessage]);

  // Handle gender filter change
  const handleGenderFilterChange = React.useCallback((newFilter) => {
    setGenderFilter(newFilter);
    // Invalidate cache for this view since data may have changed
    invalidateCache(newFilter);
    
    // Persist preference to backend
    try {
      chatApi.updateDiscoveringPreference(newFilter).catch(err => {
        console.warn('Failed to save preference:', err);
        // Silently fail - UI change already happened
      });
    } catch (err) {
      console.warn('Error updating preference:', err);
    }
    
    // Trigger fetch with new filter
  }, [invalidateCache]);

  React.useEffect(() => {
    void fetchProfiles(genderFilter);
  }, [genderFilter, fetchProfiles]);

  // Load initial profiles on discover tab activation
  React.useEffect(() => {
    if (activeTab === 'discover' && allProfiles.length === 0 && !loading) {
      void fetchProfiles(genderFilter);
    }
  }, [activeTab]);

  React.useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await chatApi.getMatches();
        setServerMatches(data.matches || []);
      } catch (err) {
        console.error('Error fetching matches:', err);
      }
    };
    fetchMatches();
  }, []);

  React.useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await chatApi.getConversations();
        const conversations = data?.conversations || [];
        setActiveConversationCount(conversations.length);
      } catch (err) {
        console.error('Error fetching conversations:', err);
      }
    };

    fetchConversations();
  }, []);

  // Fetch pending incoming requests (connection + chat)
  React.useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        setLoadingLikes(true);
        const data = await connectionApi.getIncomingRequests();
        setPendingLikes(data?.data?.requests || []);
      } catch (err) {
        console.error('Error fetching pending requests:', err);
      } finally {
        setLoadingLikes(false);
      }
    };
    fetchPendingRequests();
  }, []);

  React.useEffect(() => {
    const fetchConnections = async () => {
      try {
        setLoadingConnections(true);
        const [legacyData, modernData] = await Promise.allSettled([
          likesApi.getConnections(''),
          connectionApi.getConnections()
        ]);

        const legacyConnections = legacyData.status === 'fulfilled' ? (legacyData.value?.connections || []) : [];
        const modernConnectionsRaw = modernData.status === 'fulfilled'
          ? (modernData.value?.data?.connections || modernData.value?.connections || [])
          : [];

        const modernConnections = (modernConnectionsRaw || []).map((item) => ({
          _id: item?._id,
          participant: item?.participant,
          updatedAt: item?.updatedAt || item?.createdAt,
          matchedAt: item?.createdAt,
          connectionMeta: item?.connectionMeta || { favorite: false, muted: false, tag: 'Friend' }
        }));

        const mergedByParticipant = new Map();
        [...modernConnections, ...legacyConnections].forEach((item) => {
          const participantId = item?.participant?._id || item?.participant?.id;
          if (!participantId) {
            return;
          }
          const key = String(participantId);
          if (!mergedByParticipant.has(key)) {
            mergedByParticipant.set(key, item);
            return;
          }
          const existing = mergedByParticipant.get(key);
          if (item?.connectionMeta && !existing?.connectionMeta) {
            mergedByParticipant.set(key, item);
          }
        });

        setConnections(Array.from(mergedByParticipant.values()));
      } catch (err) {
        console.error('Error fetching connections:', err);
      } finally {
        setLoadingConnections(false);
      }
    };

    fetchConnections();
  }, []);

  // Set up real-time socket notifications
  const handleNewLike = React.useCallback((data) => {
    refreshIncomingRequests()
      .then(() => {
        setLikeNotification(data.message);
        setTimeout(() => setLikeNotification(null), 3000);
      })
      .catch(err => console.error('Error refreshing requests:', err));
  }, [refreshIncomingRequests]);

  const handleNewMatch = React.useCallback((data) => {
    setLikeNotification(data.message);
    setTimeout(() => setLikeNotification(null), 3000);
    
    chatApi.getMatches()
      .then(response => setServerMatches(response.matches || []))
      .catch(err => console.error('Error refreshing matches:', err));

    chatApi.getConversations()
      .then(response => setActiveConversationCount((response?.conversations || []).length))
      .catch(err => console.error('Error refreshing conversations:', err));
  }, []);

  const handleIncomingRequest = React.useCallback((data) => {
    const isChat = (data?.requestType || 'connection') === 'chat';
    setLikeNotification(isChat ? '💬 New chat request received' : '💌 New connection request received');
    setTimeout(() => setLikeNotification(null), 3200);
    void refreshIncomingRequests();
  }, [refreshIncomingRequests]);

  const handleRequestUpdate = React.useCallback((data) => {
    const status = data?.status;
    if (status === 'accepted') {
      setLikeNotification('✅ Your request was accepted');
    } else if (status === 'declined') {
      setLikeNotification('❌ Your request was declined');
    } else if (status === 'cancelled') {
      setLikeNotification('⚪ A request was cancelled');
    } else {
      return;
    }
    setTimeout(() => setLikeNotification(null), 3200);
    void refreshIncomingRequests();
  }, [refreshIncomingRequests]);

  useNotificationSocket(handleNewLike, handleNewMatch, handleRequestUpdate, handleIncomingRequest);

  // Filter out admin users
  const visibleProfiles = allProfiles.filter(profile => 
    profile.role !== 'admin' && profile.role !== 'super_admin' && profile.role !== 'moderator'
  );

  // Redirect admins to admin portal
  React.useEffect(() => {
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin' || currentUser.role === 'moderator')) {
      navigate('/admin-portal', { replace: true });
    }
  }, [currentUser, navigate]);

  const currentProfile = visibleProfiles[currentProfileIndex];
  const myMatches = serverMatches
    .map((m) => m.participant)
    .filter(Boolean)
    .slice(0, 12);
  const matchedProfileIds = React.useMemo(() => {
    return new Set(
      (serverMatches || [])
        .map((item) => item?.participant?._id || item?.participant?.id)
        .filter(Boolean)
        .map((item) => String(item))
    );
  }, [serverMatches]);
  const filteredConnections = React.useMemo(() => {
    const query = connectionsSearch.trim().toLowerCase();
    if (!query) {
      return connections;
    }

    return connections.filter((item) => {
      const haystack = `${item?.participant?.name || ''} ${item?.participant?.college || ''} ${item?.participant?.course || ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [connections, connectionsSearch]);

  const connectedProfileIds = React.useMemo(() => {
    return new Set(
      (connections || [])
        .map((item) => item?.participant?._id || item?.participant?.id)
        .filter(Boolean)
        .map((item) => String(item))
    );
  }, [connections]);
  const isPremiumMember = Boolean(currentUser?.isPremium || currentUser?.subscriptionStatus === 'active');
  const profileCompletion = React.useMemo(() => {
    if (!currentUser) {
      return 0;
    }
    const checkpoints = [
      currentUser.name,
      currentUser.bio,
      currentUser.course,
      currentUser.year,
      currentUser.college,
      currentUser.profilePhoto || currentUser.avatar,
      Array.isArray(currentUser.interests) && currentUser.interests.length > 0
    ];
    const completed = checkpoints.filter(Boolean).length;
    return Math.round((completed / checkpoints.length) * 100);
  }, [currentUser]);

  const goNextProfile = () => {
    const nextIndex = currentProfileIndex + 1;
    
    // If near the end (within 10 profiles), load more
    if (nextIndex >= visibleProfiles.length - 10 && nextIndex <= visibleProfiles.length - 1) {
      setProfilePage(prev => prev + 1);
    }
    
    // Always advance if there are more profiles
    if (nextIndex < visibleProfiles.length) {
      setCurrentProfileIndex(nextIndex);
    }
  };

  const currentProfileConnected = connectedProfileIds.has(String(currentProfile?._id || currentProfile?.id || ''));

  const handleLike = async () => {
    const profileId = currentProfile._id || currentProfile.id;
    let shouldAdvanceProfile = true;
    if (!profileId) {
      console.error('No profile ID found');
      setLikeNotification('❌ Error: No profile selected');
      setTimeout(() => setLikeNotification(null), 3000);
      return;
    }

    if (connectedProfileIds.has(String(profileId))) {
      await openChat(currentProfile);
      setLikeNotification(`💬 You are already connected with ${currentProfile.name}. Opening chat...`);
      setTimeout(() => setLikeNotification(null), 2800);
      return;
    }

    try {
      await connectionApi.sendRequest(profileId);
      triggerEmotion('request', 'Connection request sent');
      setLikeNotification(`💌 Request sent to ${currentProfile.name}`);
      setTimeout(() => setLikeNotification(null), 2600);
      
      if (!likedProfiles.includes(profileId)) {
        setLikedProfiles([...likedProfiles, profileId]);
      }
    } catch (err) {
      const errorMsg = String(err?.message || 'Request failed').toLowerCase();

      if (errorMsg.includes('already connected')) {
        shouldAdvanceProfile = false;
        setLikeNotification(`💬 You are already connected with ${currentProfile.name}. Opening chat...`);
        setTimeout(() => setLikeNotification(null), 2800);
        await openChat(currentProfile);
      } else if (errorMsg.includes('already pending') || errorMsg.includes('already sent') || errorMsg.includes('wait before sending')) {
        setLikeNotification(`⏳ Request already sent to ${currentProfile.name}`);
        setTimeout(() => setLikeNotification(null), 2800);
      } else if (errorMsg.includes('route /api/connections/requests not found') || errorMsg.includes('route /api/connections/request not found')) {
        try {
          const legacyResponse = await likesApi.likeProfile(profileId);
          const matched = Boolean(legacyResponse?.matched || legacyResponse?.match || legacyResponse?.conversation);

          if (matched) {
            shouldAdvanceProfile = false;
            triggerEmotion('match', 'It\'s a Match');
            setLikeNotification(`🎉 You matched with ${currentProfile.name}! Opening chat...`);
            setTimeout(() => setLikeNotification(null), 3200);
            const conversationId = legacyResponse?.conversation?._id;
            if (conversationId) {
              navigate(`/chat?conversationId=${conversationId}`);
            }
          } else {
            setLikeNotification(`💌 Request sent to ${currentProfile.name}`);
            setTimeout(() => setLikeNotification(null), 2600);
          }
        } catch (legacyErr) {
          shouldAdvanceProfile = false;
          setLikeNotification(`❌ ${legacyErr?.message || 'Failed to send request'}`);
          setTimeout(() => setLikeNotification(null), 3500);
        }
      } else {
        shouldAdvanceProfile = false;
        setLikeNotification(`❌ ${err?.message || 'Failed to send request'}`);
        setTimeout(() => setLikeNotification(null), 3500);
      }
    } finally {
      if (shouldAdvanceProfile) {
        goNextProfile();
      }
    }
  };

  const handleDislike = async () => {
    const profileId = currentProfile?._id || currentProfile?.id;
    try {
      if (profileId) {
        await chatApi.swipeProfile(profileId, 'pass');
      }
    } catch (err) {
      console.error('Pass failed:', err);
    } finally {
      goNextProfile();
    }
  };

  const handleSuperLike = handleLike;

  const handleChatRequest = async () => {
    const profileId = currentProfile?._id || currentProfile?.id;
    if (!profileId) {
      setLikeNotification('❌ Error: No profile selected');
      setTimeout(() => setLikeNotification(null), 3000);
      return;
    }

    if (connectedProfileIds.has(String(profileId))) {
      await openChat(currentProfile);
      setLikeNotification(`💬 Already connected with ${currentProfile.name}. Opening chat...`);
      setTimeout(() => setLikeNotification(null), 2800);
      return;
    }

    try {
      await connectionApi.sendRequest(profileId, {
        requestType: 'chat',
        requestMessage: 'I would like to start chatting with you 💬'
      });
      triggerEmotion('request', 'Chat request sent');
      setLikeNotification(`💬 Chat request sent to ${currentProfile.name}`);
      setTimeout(() => setLikeNotification(null), 2800);
      goNextProfile();
    } catch (err) {
      const errorMsg = String(err?.message || 'Request failed').toLowerCase();
      if (errorMsg.includes('already connected')) {
        await openChat(currentProfile);
        setLikeNotification(`💬 Already connected with ${currentProfile.name}. Opening chat...`);
        setTimeout(() => setLikeNotification(null), 2800);
        return;
      }

      if (errorMsg.includes('already pending') || errorMsg.includes('already sent')) {
        setLikeNotification(`⏳ Request already pending for ${currentProfile.name}`);
        setTimeout(() => setLikeNotification(null), 2800);
        return;
      }

      if (errorMsg.includes('route /api/connections/request') || errorMsg.includes('route /api/connections/requests')) {
        setLikeNotification('❌ Connection service is temporarily unavailable. Please refresh and try again.');
        setTimeout(() => setLikeNotification(null), 3200);
        return;
      }

      setLikeNotification(`❌ ${err?.message || 'Failed to send chat request'}`);
      setTimeout(() => setLikeNotification(null), 3200);
    }
  };

  const handleAcceptLike = async (response) => {
    try {
      const matchedName = response?.like?.likedBy?.name || response?.match?.participant?.name || 'your match';
      triggerEmotion('accepted', 'Request accepted');
      setLikeNotification(`❤️ You matched with ${matchedName}!`);
      setTimeout(() => setLikeNotification(null), 3000);

      const matchedUser = response?.matchedUser || response?.match?.participant || response?.like?.likedBy || null;
      if (matchedUser && currentUser) {
        setMatchPopupData({
          currentUser,
          matchedUser,
          conversationId: response?.conversation?._id || ''
        });
      }

      const refreshed = await chatApi.getMatches();
      setServerMatches(refreshed.matches || []);

      const refreshedConversations = await chatApi.getConversations();
      setActiveConversationCount((refreshedConversations?.conversations || []).length);

      const conversationId = response?.conversation?._id;
      if (conversationId) {
        navigate(`/chat?conversationId=${conversationId}`);
      }
    } catch (err) {
      console.error('Accept like failed:', err);
      const errorMsg = err?.message || 'Failed to accept like';
      setLikeNotification(`❌ ${errorMsg}`);
      setTimeout(() => setLikeNotification(null), 4000);
    }
  };

  const handleRejectLike = async () => {
    try {
      setLikeNotification('👋 Like rejected');
      setTimeout(() => setLikeNotification(null), 2000);

      await refreshIncomingRequests();
    } catch (err) {
      console.error('Reject like failed:', err);
      const errorMsg = err?.message || 'Failed to reject like';
      setLikeNotification(`❌ ${errorMsg}`);
      setTimeout(() => setLikeNotification(null), 4000);
    }
  };

  const updateConnectionMeta = async (matchId, payload) => {
    const previous = [...connections];
    setConnections((prev) => prev.map((item) => item._id === matchId ? {
      ...item,
      connectionMeta: {
        ...item.connectionMeta,
        ...payload
      }
    } : item));

    try {
      await likesApi.updateConnectionMeta(matchId, payload);
    } catch (err) {
      setConnections(previous);
      setLikeNotification(`❌ ${err.message || 'Failed to update connection'}`);
      setTimeout(() => setLikeNotification(null), 2500);
    }
  };

  const handleRemoveConnection = async (match) => {
    if (!window.confirm(`Remove connection with ${match?.participant?.name || 'this person'}?`)) {
      return;
    }

    try {
      await likesApi.removeConnection(match._id);
      setConnections((prev) => prev.filter((item) => item._id !== match._id));
      setLikeNotification('Connection removed');
      setTimeout(() => setLikeNotification(null), 2500);
      const refreshedConversations = await chatApi.getConversations();
      setActiveConversationCount((refreshedConversations?.conversations || []).length);
    } catch (err) {
      setLikeNotification(`❌ ${err.message || 'Failed to remove connection'}`);
      setTimeout(() => setLikeNotification(null), 3000);
    }
  };

  const openChat = async (match) => {
    const participantId =
      match?.participant?._id ||
      match?.participant?.id ||
      match?.userId ||
      match?.otherUser?._id ||
      match?.likedBy?._id ||
      match?.id;

    if (!participantId) {
      navigate('/chat');
      return;
    }

    try {
      const response = await chatApi.createOrGetConversation(participantId);
      const conversationId = response?.data?.conversation?._id || response?.conversation?._id;

      if (conversationId) {
        navigate(`/chat?conversationId=${conversationId}`);
        return;
      }

      navigate(`/chat?participantId=${participantId}`);
    } catch (err) {
      console.error('Failed to open conversation:', err);
      const message = String(err?.message || '').toLowerCase();

      if (message.includes('request acceptance') || message.includes('request accepted') || message.includes('messaging is allowed only after request acceptance')) {
        try {
          await connectionApi.sendRequest(participantId, {
            requestType: 'chat',
            requestMessage: 'I would like to start chatting with you 💬'
          });
          setLikeNotification('💬 Chat request sent. Ask them to check Requests.');
          setTimeout(() => setLikeNotification(null), 3200);
          setTab('requests');
          return;
        } catch (requestErr) {
          const requestMsg = String(requestErr?.message || '').toLowerCase();
          if (requestMsg.includes('already pending') || requestMsg.includes('already sent')) {
            setLikeNotification('⏳ Chat request already pending. Waiting for acceptance.');
            setTimeout(() => setLikeNotification(null), 3200);
            setTab('requests');
            return;
          }
        }
      }

      navigate(`/chat?participantId=${participantId}`);
    }
  };

  return (
    <DashboardErrorBoundary>
      <EmotionalFeedbackLayer cue={emotionCue} onDone={() => setEmotionCue(null)} />
      {matchPopupData ? (
        <EnhancedMatchPopup
          currentUser={matchPopupData.currentUser}
          matchedUser={matchPopupData.matchedUser}
          conversationId={matchPopupData.conversationId}
          onStartChat={(conversationId) => {
            setMatchPopupData(null);
            if (conversationId) {
              navigate(`/chat?conversationId=${conversationId}`);
              return;
            }
            navigate('/chat');
          }}
          onClose={() => setMatchPopupData(null)}
        />
      ) : null}
      <BottomNav />
      <div className="pt-0 pb-24 md:pb-0 min-h-screen w-full relative overflow-hidden bg-[radial-gradient(circle_at_14%_10%,rgba(251,113,133,0.16),transparent_34%),radial-gradient(circle_at_88%_6%,rgba(244,114,182,0.16),transparent_32%),linear-gradient(180deg,#fffafd_0%,#fff7fb_58%,#fff2f8_100%)]">
        <div className="pointer-events-none absolute top-16 left-[18%] h-72 w-72 rounded-full bg-rose-300/20 blur-[110px]" />
        <div className="pointer-events-none absolute bottom-0 right-[8%] h-72 w-72 rounded-full bg-fuchsia-200/25 blur-[120px]" />

        {/* Notification Toast - Soft Premium */}
        {likeNotification && (
          <div className="fixed top-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm rounded-full px-6 py-3 shadow-md border z-50 animate-bounce-in md:top-[4.5rem]" style={{ backgroundColor: 'var(--portal-surface)', borderColor: 'var(--border-light)', color: 'var(--text-light)' }}>
            <p className="text-center font-semibold">{likeNotification}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="h-full md:pt-20 w-full relative z-10">
          {/* Desktop Layout - Premium Dating Experience */}
          <div className="hidden md:block w-full px-3 md:px-5 xl:px-8 py-6 xl:py-8">
            <div className="mx-auto w-full max-w-[1780px] grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_330px] gap-8 xl:gap-10 items-start">
              <div>
                <div className="mb-6 rounded-3xl px-6 py-5 md:px-7 md:py-6" style={{ backgroundColor: 'rgba(255,255,255,0.92)', border: '1px solid rgba(251,113,133,0.25)', boxShadow: '0 20px 55px rgba(190,24,93,0.08)' }}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.25em] font-semibold" style={{ color: '#be185d' }}>Private Campus Network</p>
                      <h1 className="text-3xl xl:text-4xl font-bold mt-2 leading-tight" style={{ color: '#831843' }}>Discover people. Send a request. Build your circle.</h1>
                    </div>
                    <div className="hidden xl:flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold" style={{ backgroundColor: 'rgba(255,255,255,0.85)', border: '1px solid rgba(251,113,133,0.3)', color: '#9f1239' }}>
                      <span className="text-emerald-500">●</span>
                      {activeConversationCount} chats
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setTab('discover')}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition ${activeTab === 'discover' ? 'text-white' : 'text-gray-600'}`}
                      style={{ backgroundColor: activeTab === 'discover' ? '#ec4899' : 'rgba(255,255,255,0.88)', color: activeTab === 'discover' ? '#ffffff' : '#9f1239', border: '1px solid rgba(251,113,133,0.3)' }}
                    >
                      🔎 Discover
                    </button>
                    <button
                      onClick={() => setTab('requests')}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition relative`}
                      style={{ backgroundColor: activeTab === 'requests' ? '#ec4899' : 'rgba(255,255,255,0.88)', color: activeTab === 'requests' ? '#ffffff' : '#9f1239', border: '1px solid rgba(251,113,133,0.3)' }}
                    >
                      💌 Requests
                      {pendingLikes.length > 0 ? (
                        <span className="absolute -top-2 -right-2 w-5 h-5 text-[10px] rounded-full text-white flex items-center justify-center border border-white/30" style={{ backgroundColor: 'var(--accent-pink)' }}>
                          {pendingLikes.length}
                        </span>
                      ) : null}
                    </button>
                    <button
                      onClick={() => setTab('connections')}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition relative`}
                      style={{ backgroundColor: activeTab === 'connections' ? '#ec4899' : 'rgba(255,255,255,0.88)', color: activeTab === 'connections' ? '#ffffff' : '#9f1239', border: '1px solid rgba(251,113,133,0.3)' }}
                    >
                      🤝 Connections
                    </button>

                    {activeTab === 'discover' ? (
                      <button
                        type="button"
                        onClick={() => setShowThemeOptions((prev) => !prev)}
                        className="ml-auto px-4 py-2 rounded-full text-sm font-semibold transition"
                        style={{
                          backgroundColor: showThemeOptions ? 'var(--accent-pink)' : 'rgba(255,255,255,0.88)',
                          color: showThemeOptions ? '#ffffff' : '#9f1239',
                          border: showThemeOptions ? '1px solid var(--accent-pink)' : '1px solid rgba(251,113,133,0.3)'
                        }}
                      >
                        🎨 Theme Options
                      </button>
                    ) : null}

                  </div>
                </div>

                <div className="relative">
                  {activeTab === 'requests' ? (
                    <div className="rounded-2xl min-h-[760px] p-5" style={{ backgroundColor: 'var(--dark-secondary)', border: '1px solid var(--border-light)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }}>
                      <LikeRequests onAcceptSuccess={handleAcceptLike} onRejectSuccess={handleRejectLike} />
                    </div>
                  ) : activeTab === 'connections' ? (
                    <div className="rounded-2xl min-h-[760px] p-5 space-y-4" style={{ backgroundColor: 'var(--dark-secondary)', border: '1px solid var(--border-light)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' }}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--accent-pink)' }}>Your People</p>
                          <h3 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>Connections</h3>
                        </div>
                        <button onClick={() => navigate('/chat')} className="px-3 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: 'var(--accent-pink)', color: '#fff' }}>Open Inbox</button>
                      </div>

                      <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--border-light)' }}>
                        <span className="text-sm">🔍</span>
                        <input
                          type="text"
                          value={connectionsSearch}
                          onChange={(event) => setConnectionsSearch(event.target.value)}
                          placeholder="Search by name, college, or course"
                          className="flex-1 bg-transparent text-sm outline-none"
                          style={{ color: 'var(--text-dark)' }}
                        />
                      </div>

                      {loadingConnections ? (
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading connections...</p>
                      ) : (
                        <RecentMatches
                          matches={filteredConnections}
                          mode="connections"
                          onMessage={openChat}
                          onTagChange={(item, tag) => updateConnectionMeta(item._id, { tag })}
                          onToggleFavorite={(item, favorite) => updateConnectionMeta(item._id, { favorite })}
                          onToggleMute={(item, muted) => updateConnectionMeta(item._id, { muted })}
                          onRemoveConnection={handleRemoveConnection}
                        />
                      )}
                    </div>
                  ) : (
                    <>
                      {/* ===== APPEARANCE & THEME PANEL ===== */}
                      {showThemeOptions ? (
                      <div
                        className="rounded-3xl p-5 md:p-6 mb-5 theme-transition-scope"
                        style={{
                          backgroundColor: 'var(--dark-secondary)',
                          border: '1px solid var(--border-light)',
                          boxShadow: '0 16px 42px rgba(0, 0, 0, 0.09)'
                        }}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold" style={{ color: 'var(--accent-pink)' }}>Appearance & Theme</p>
                            <h3 className="text-2xl md:text-3xl font-bold mt-1" style={{ color: 'var(--text-dark)' }}>Customize Your Experience</h3>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Choose how your app looks and feels</p>
                          </div>
                          <div className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                            Theme settings • instant apply
                          </div>
                        </div>

                        <div className="mt-5 space-y-4">
                          {themeSections.map((section) => (
                            <section
                              key={section.id}
                              className="rounded-2xl p-3 md:p-4"
                              style={{
                                backgroundColor: 'var(--glass-bg)',
                                border: '1px solid var(--border-light)'
                              }}
                            >
                              <div className="flex items-center justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">{section.icon}</span>
                                  <h4 className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>{section.title}</h4>
                                </div>
                                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{section.subtitle}</p>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 md:gap-3">
                                {section.items.map((theme) => {
                                  const isActive = activeTheme === theme.id;
                                  const isDarkTheme = String(theme.tone || '').toLowerCase() === 'dark';
                                  return (
                                    <button
                                      key={theme.id}
                                      type="button"
                                      onClick={() => setTheme(theme.id)}
                                      title={theme.description}
                                      className="group relative rounded-2xl p-3 text-left theme-transition-scope"
                                      style={{
                                        backgroundColor: isDarkTheme ? 'rgba(9,14,32,0.42)' : 'var(--dark-secondary)',
                                        border: isActive ? '1px solid var(--accent-pink)' : '1px solid var(--border-light)',
                                        boxShadow: isActive ? '0 14px 30px rgba(236, 72, 153, 0.24)' : '0 8px 16px rgba(15, 23, 42, 0.08)',
                                        transform: isActive ? 'translateY(-2px)' : 'translateY(0px)'
                                      }}
                                    >
                                      <div className="relative h-20 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-light)' }}>
                                        <div className="absolute inset-0" style={{ background: theme.preview }} />
                                        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(0,0,0,0.12))' }} />
                                        <div className="absolute inset-x-2 top-2 h-1.5 rounded-full bg-white/70" />
                                        <div className="absolute top-6 left-2 right-2 h-[1px] bg-white/30" />
                                        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5">
                                          <span className="w-5 h-5 rounded-full bg-white/75 border border-white/80" />
                                          <span className="h-2.5 rounded-full bg-white/75 w-16" />
                                          <span className="h-2.5 rounded-full bg-white/55 w-8" />
                                        </div>
                                      </div>

                                      <div className="mt-3 flex items-start justify-between gap-2">
                                        <div>
                                          <p className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>{theme.name}</p>
                                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{theme.tone} mode</p>
                                          <p className="text-[11px] mt-1 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>{theme.description}</p>
                                        </div>
                                        {isActive ? (
                                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', boxShadow: '0 6px 14px rgba(236,72,153,0.35)' }}>
                                            ✓ Active
                                          </span>
                                        ) : null}
                                      </div>

                                      {isActive ? (
                                        <span className="absolute top-2 right-2 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center" style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: '2px solid var(--dark-secondary)', boxShadow: '0 6px 14px rgba(236,72,153,0.35)' }}>
                                          ✓
                                        </span>
                                      ) : null}
                                    </button>
                                  );
                                })}
                              </div>
                            </section>
                          ))}
                        </div>
                      </div>
                      ) : null}

                      {/* ===== DISCOVER HERO STAGE ===== */}
                      <div className="mb-4 rounded-2xl px-4 py-3 flex flex-wrap items-center gap-2.5" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.86), rgba(252,238,243,0.82))', border: '1px solid rgba(251,113,133,0.2)', boxShadow: '0 10px 24px rgba(190,24,93,0.09)' }}>
                        <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: 'rgba(255,107,138,0.16)', color: '#9f1239' }}>
                          💘 Discover Focus
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: 'rgba(176,123,172,0.17)', color: '#7c3a6f' }}>
                          {currentProfileIndex + 1} / {Math.max(visibleProfiles.length, 1)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: 'rgba(244,114,182,0.14)', color: '#9f1239' }}>
                          {likedProfiles.length} requests sent
                        </span>
                        <span className="ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: 'rgba(16,185,129,0.16)', color: '#065f46' }}>
                          ● Live discover
                        </span>
                      </div>

                      {/* ===== PREMIUM GENDER FILTER ===== */}
                      {activeTab === 'discover' && (
                        <GenderFilterToggle
                          currentFilter={genderFilter}
                          onFilterChange={handleGenderFilterChange}
                          userGender={currentUser?.gender}
                        />
                      )}

                      <div className="relative h-[83vh] min-h-[760px] max-h-[980px] rounded-[2rem] p-3 overflow-hidden" style={{ background: 'linear-gradient(155deg, rgba(255,255,255,0.9), rgba(252,238,243,0.84) 54%, rgba(248,232,240,0.8))', border: '1px solid rgba(251,113,133,0.24)', boxShadow: '0 28px 78px rgba(190,24,93,0.16)' }}>
                        <div className="pointer-events-none absolute -top-12 -right-14 w-44 h-44 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(251,113,133,0.21)' }} />
                        <div className="pointer-events-none absolute -bottom-14 -left-10 w-40 h-40 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(176,123,172,0.2)' }} />

                        <div className="relative w-full h-full rounded-[1.75rem] overflow-hidden border" style={{ borderColor: 'rgba(251,113,133,0.22)', backgroundColor: 'rgba(255,255,255,0.78)' }}>
                      {error || profileLoadError ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center" style={{ backgroundColor: 'var(--dark-tertiary)' }}>
                          <p className="text-7xl mb-5">💔</p>
                          <h3 className="text-3xl font-bold text-white mb-2" style={{ color: 'var(--text-dark)' }}>Swipe queue paused</h3>
                          <p className="text-rose-100/80 mb-6 max-w-md" style={{ color: 'var(--text-secondary)' }}>{error || profileLoadError}</p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                setLikedProfiles([]);
                                void fetchProfiles(genderFilter);
                              }}
                              className="btn-primary px-8 py-3"
                            >
                              Retry Discover
                            </button>
                            {error &&  (
                              <button
                                onClick={() => handleGenderFilterChange('both')}
                                className="btn-secondary px-8 py-3"
                                style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}
                              >
                                Reset Filter
                              </button>
                            )}
                          </div>
                        </div>
                      ) : null}

                      {/* Loading skeleton state */}
                      {isLoadingProfiles && !currentProfile && (
                        <DiscoverCardSkeleton />
                      )}

                      {!error && !profileLoadError && !isLoadingProfiles && !currentProfile && allProfiles.length === 0 ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center" style={{ backgroundColor: 'var(--dark-tertiary)' }}>
                          <div className="text-8xl mb-5">💖</div>
                          <h3 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-dark)' }}>No new people found</h3>
                          <p className="mb-6 max-w-md" style={{ color: 'var(--text-secondary)' }}>
                             {genderFilter !== 'both' 
                              ? `Try switching filters or check back later for new ${genderFilter}s. Premium members get priority! 💫`
                              : 'Check back later for new profiles. Premium members get priority! 💫'}
                          </p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                handleGenderFilterChange('both');
                                setLikedProfiles([]);
                              }}
                              className="btn-primary px-8 py-3"
                            >
                              Show All People
                            </button>
                            <button
                              onClick={() => {
                                setLikedProfiles([]);
                                void fetchProfiles(genderFilter);
                              }}
                              className="btn-secondary px-8 py-3"
                              style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}
                            >
                              Refresh
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {!error && !profileLoadError && !isLoadingProfiles && currentProfile ? (
                        <>
                          <div className="w-full h-full flex flex-col">
                            <EnhancedProfileCard
                              key={currentProfile?._id || currentProfile?.id || currentProfileIndex}
                              profile={currentProfile}
                              onLike={handleLike}
                              onDislike={handleDislike}
                              onSuperLike={handleSuperLike}
                              onChatRequest={handleChatRequest}
                            />
                          </div>
                        </>
                      ) : null}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <aside className="hidden lg:block sticky top-20 space-y-5">
                <div className="rounded-2xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(251,113,133,0.24)', boxShadow: '0 14px 38px rgba(190,24,93,0.08)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden border flex items-center justify-center" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--glass-bg)' }}>
                      {resolvePublicProfileVisual(currentUser).type === 'photo' ? (
                        <img src={resolvePublicProfileVisual(currentUser).value} alt={currentUser?.name || 'User'} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">{resolvePublicProfileVisual(currentUser).value}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold truncate" style={{ color: 'var(--text-dark)' }}>{currentUser?.name || 'Your profile'}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{isPremiumMember ? '✨ Premium' : 'Verified'}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-[11px] mb-1" style={{ color: 'var(--text-secondary)' }}>
                      <span>Profile completeness</span>
                      <span>{profileCompletion}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--border-light)' }}>
                      <div className="h-full rounded-full" style={{ width: `${profileCompletion}%`, background: `linear-gradient(90deg, var(--accent-pink), var(--accent-purple))` }} />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Link to="/profile" className="block">
                      <button className="w-full px-3 py-2 rounded-lg text-sm font-semibold transition" style={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--border-light)', color: 'var(--text-dark)' }}>✏️ Edit Profile</button>
                    </Link>
                    <button onClick={() => navigate('/chat')} className="w-full px-3 py-2 rounded-lg text-sm font-semibold transition" style={{ backgroundColor: 'var(--accent-pink)', border: 'none', color: '#ffffff' }}>💬 Conversations</button>
                    <button
                      onClick={() => {
                        clearAuth();
                        navigate('/login', { replace: true });
                      }}
                      className="w-full px-3 py-2 rounded-lg text-sm font-semibold transition"
                      style={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--border-light)', color: 'var(--text-dark)' }}
                    >
                      🚪 Logout
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(251,113,133,0.34)', boxShadow: '0 16px 42px rgba(190,24,93,0.1)' }}>
                  <p className="text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--accent-pink)', fontWeight: '600' }}>✨ Premium</p>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--text-dark)' }}>{isPremiumMember ? '💎 VIP Unlocked' : '🚀 Go Premium'}</h3>
                  <p className="text-xs mt-1 mb-3" style={{ color: 'var(--text-secondary)' }}>Priority visibility, instant insights, elite filters.</p>
                  <div className="space-y-1 mb-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <p>✨ See limitless likes</p>
                    <p>💬 Priority messaging</p>
                    <p>🎯 Smart boosts</p>
                  </div>
                  {!isPremiumMember ? (
                    <Link to="/pricing" className="block">
                      <button className="w-full px-3 py-2 rounded-lg font-bold transition" style={{ backgroundColor: 'var(--accent-pink)', color: '#ffffff', border: 'none' }}>Upgrade Now</button>
                    </Link>
                  ) : (
                    <button className="w-full px-3 py-2 rounded-lg font-semibold" style={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--accent-pink)', color: 'var(--accent-pink)' }}>✓ Active</button>
                  )}
                </div>

                <div className="rounded-2xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(251,113,133,0.24)', boxShadow: '0 14px 38px rgba(190,24,93,0.08)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold" style={{ color: 'var(--text-dark)' }}>🤝 Campus Circle</p>
                    <button onClick={() => setTab('connections')} className="text-[11px] font-semibold" style={{ color: 'var(--accent-pink)' }}>Manage</button>
                  </div>
                  <RecentMatches
                    matches={connections.length ? connections.slice(0, 6) : myMatches}
                    mode={connections.length ? 'connections' : 'matches'}
                    onMessage={openChat}
                    onViewAll={() => navigate('/chat')}
                    compact
                    onTagChange={(item, tag) => updateConnectionMeta(item._id, { tag })}
                    onToggleFavorite={(item, favorite) => updateConnectionMeta(item._id, { favorite })}
                    onToggleMute={(item, muted) => updateConnectionMeta(item._id, { muted })}
                    onRemoveConnection={handleRemoveConnection}
                  />
                </div>
              </aside>
            </div>
          </div>

          {/* Mobile Layout - Full Width */}
          <div className="md:hidden px-4 py-6 w-full">
            {/* Header with Logout */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-dark)' }}>Discover</h1>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Find people to connect with on campus</p>
              </div>
              <button
                onClick={() => {
                  clearAuth();
                  navigate('/login', { replace: true });
                }}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/50 text-xs rounded-full font-semibold transition"
                title="Logout"
              >
                🚪
              </button>
            </div>

            {/* Profile Card - Mobile */}
            <div className="relative h-[620px] rounded-[2rem] p-2.5 overflow-hidden shadow-[0_26px_70px_rgba(190,24,93,0.2)] mb-6 border border-rose-200/70 bg-white/80 w-full">
              <div className="pointer-events-none absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl bg-rose-300/35" />
              <div className="pointer-events-none absolute -bottom-12 -left-8 w-36 h-36 rounded-full blur-3xl bg-fuchsia-300/30" />
              <div className="relative w-full h-full rounded-[1.6rem] overflow-hidden border border-rose-200/60 bg-white/85">
              {error && (
                <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-8 border border-red-500/20 backdrop-blur-md">
                  <p className="text-6xl mb-4">❌</p>
                  <h3 className="text-xl font-bold text-red-400 mb-2">Error Loading</h3>
                  <p className="text-gray-300 text-sm mb-4">{error}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="btn-primary px-6 py-2 text-sm"
                  >
                    Try Again
                  </button>
                </div>
              )}
              {!error && !loading && !currentProfile && (
                <div className="w-full h-full bg-gradient-to-br from-slate-900/80 to-slate-800/80 flex flex-col items-center justify-center p-6 border border-purple-500/20 backdrop-blur-md">
                  <p className="text-6xl mb-4">🎉</p>
                  <h3 className="text-xl font-bold text-white mb-1">All Done!</h3>
                  <p className="text-gray-300 text-sm mb-4">Check back tomorrow for more!</p>
                  <button 
                    onClick={() => {
                      setCurrentProfileIndex(0);
                      setLikedProfiles([]);
                      window.location.reload();
                    }}
                    className="btn-primary px-6 py-2 text-sm"
                  >
                    Refresh
                  </button>
                </div>
              )}
              {!error && !loading && currentProfile && (
                <EnhancedProfileCard
                  key={currentProfile?._id || currentProfile?.id || currentProfileIndex}
                  profile={currentProfile}
                  onLike={handleLike}
                  onDislike={handleDislike}
                  onSuperLike={handleSuperLike}
                  onChatRequest={handleChatRequest}
                />
              )}
              </div>
            </div>

            {/* Mobile Info Cards */}
            {!loading && !error && visibleProfiles.length > 0 && (
              <div className="space-y-4">
                {/* Quick Stats Card - Glassmorphism */}
                <div className="glass-panel rounded-2xl p-4 border border-white/15">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent">{currentProfileIndex + 1}</p>
                      <p className="text-xs text-gray-400">Profile</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent">{likedProfiles.length}</p>
                      <p className="text-xs text-gray-400">Requests Sent</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-transparent">{pendingLikes.length}</p>
                      <p className="text-xs text-gray-400">Incoming</p>
                    </div>
                  </div>
                </div>

                {/* Premium CTA Card - Glassmorphism with Glow */}
                <div className="glass-panel rounded-2xl p-4 border border-red-500/30 bg-gradient-to-br from-red-500/10 to-purple-500/10 hover:shadow-2xl transition">
                  <p className="text-xs font-bold text-red-400 mb-1 uppercase">✨ Premium</p>
                  <p className="font-bold text-white mb-2">Unlock Premium Features</p>
                  <p className="text-xs text-gray-300 mb-3">50% off for 3 months</p>
                  <Link to="/pricing">
                    <button className="btn-primary w-full px-3 py-2 text-xs rounded-full">
                      Upgrade Now 🚀
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardErrorBoundary>
  );
}

function PortalChip({ label, value, tone = 'rose' }) {
  const toneMap = {
    emerald: 'border-emerald-300/30 bg-emerald-500/10 text-emerald-100',
    rose: 'border-rose-300/30 bg-rose-500/10 text-rose-100',
    sky: 'border-sky-300/30 bg-sky-500/10 text-sky-100',
    amber: 'border-amber-300/30 bg-amber-500/10 text-amber-100'
  };

  return (
    <div className={`rounded-2xl border px-3 py-2.5 ${toneMap[tone] || toneMap.rose}`}>
      <p className="text-[10px] uppercase tracking-[0.16em] opacity-80">{label}</p>
      <p className="text-xs font-semibold mt-1">{value}</p>
    </div>
  );
}

function PortalStatCard({ title, value, note, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-white/12 bg-white/6 backdrop-blur-xl px-3.5 py-3.5 shadow-[0_12px_30px_rgba(0,0,0,0.22)] hover:bg-white/9 transition"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300/85">{title}</p>
        <span className="text-sm">{icon}</span>
      </div>
      <p className="text-xl font-bold text-white mt-1">{value}</p>
      <p className="text-[11px] text-slate-300 mt-1">{note}</p>
    </button>
  );
}
