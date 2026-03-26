import React from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import BottomNav from '../components/BottomNav';
import connectionApi from '../services/connectionApi';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../utils/apiBaseUrl';
import { getStoredToken } from '../utils/authStorage';
import { resolvePublicProfileVisual } from '../utils/profileMedia';

const API_URL = getApiBaseUrl();

function EmptyState({ type }) {
  return (
    <div className="rounded-3xl border border-rose-200/70 bg-white/95 p-8 text-center shadow-sm">
      <div className="mx-auto mb-3 w-20 h-20 rounded-full bg-gradient-to-br from-rose-100 to-fuchsia-100 flex items-center justify-center text-4xl">
        {type === 'incoming' ? '💌' : type === 'chat' ? '💬' : '📮'}
      </div>
      <h3 className="text-xl font-bold text-rose-700">
        {type === 'incoming' ? 'No incoming requests yet' : type === 'chat' ? 'No incoming chat requests yet' : 'No outgoing requests yet'}
      </h3>
      <p className="text-sm text-rose-500 mt-2">
        {type === 'incoming'
          ? 'New connection requests will appear here with profile details.'
          : type === 'chat'
          ? 'When someone sends a chat request, it will appear here.'
          : 'Send a request from Discover and track pending or accepted status here.'}
      </p>
    </div>
  );
}

function ProfilePreviewModal({ profile, onClose }) {
  if (!profile) return null;

  const visual = resolvePublicProfileVisual(profile);

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white shadow-2xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
        <div className="h-56 bg-gradient-to-br from-rose-100 via-pink-100 to-fuchsia-100 flex items-center justify-center">
          {visual.type === 'photo' ? (
            <img src={visual.value} alt={profile.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-8xl">{visual.value}</span>
          )}
        </div>
        <div className="p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-rose-500 font-semibold">Profile Preview</p>
          <h3 className="text-2xl font-bold text-rose-700 mt-1">{profile.name}</h3>
          <p className="text-sm text-rose-500 mt-1">{profile.college || 'Community Member'}</p>
          {profile.course || profile.year ? (
            <p className="text-sm text-rose-600 mt-2">{[profile.course, profile.year].filter(Boolean).join(' • ')}</p>
          ) : null}
          {profile.bio ? <p className="text-sm text-rose-700/90 mt-3 leading-relaxed">{profile.bio}</p> : null}
          <button onClick={onClose} className="mt-5 w-full rounded-xl bg-rose-500 hover:bg-rose-600 text-white py-2.5 font-semibold transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function IncomingRequestCard({ request, mutualInterests, busy, onAccept, onDecline, onViewProfile }) {
  const sender = request.senderId;
  const visual = resolvePublicProfileVisual(sender);
  const isChatRequest = (request?.requestType || 'connection') === 'chat';

  return (
    <article className="group rounded-3xl border border-rose-200/75 bg-white/95 p-5 shadow-[0_20px_45px_rgba(190,24,93,0.08)] hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(190,24,93,0.14)] transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-rose-200 bg-rose-50 flex items-center justify-center shrink-0">
          {visual.type === 'photo' ? (
            <img src={visual.value} alt={sender?.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl">{visual.value}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.16em] text-rose-500 font-semibold">{isChatRequest ? 'Incoming Chat Request' : 'Incoming Request'}</p>
          <h3 className="text-xl font-bold text-rose-700 truncate">{sender?.name || 'Community Member'}</h3>
          <p className="text-sm text-rose-500 truncate">{sender?.college || 'Your network'}</p>
          <p className="text-xs text-rose-400 mt-1">Requested on {new Date(request.createdAt).toLocaleDateString()}</p>
          {request?.requestMessage ? (
            <p className="text-xs text-rose-500 mt-1 line-clamp-1">“{request.requestMessage}”</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs text-rose-500 font-semibold mb-2">Mutual Interests</p>
        <div className="flex flex-wrap gap-2">
          {mutualInterests.length ? mutualInterests.map((interest) => (
            <span key={interest} className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs text-rose-700">
              {interest}
            </span>
          )) : (
            <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs text-rose-500">Discover by chat vibe</span>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2.5">
        <button
          onClick={onAccept}
          disabled={busy}
          className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 hover:from-rose-600 hover:to-fuchsia-600 text-white py-2.5 font-semibold transition disabled:opacity-50"
        >
          {isChatRequest ? 'Accept & Start Chat 💬' : 'Accept ❤️'}
        </button>
        <button
          onClick={onDecline}
          disabled={busy}
          className="flex-1 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 py-2.5 font-semibold transition disabled:opacity-50"
        >
          Decline ❌
        </button>
        <button
          onClick={onViewProfile}
          className="rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2.5 text-sm font-semibold transition"
        >
          View Profile
        </button>
      </div>
    </article>
  );
}

function OutgoingRequestCard({ request, busy, onCancel, onViewProfile, onStartChat, onGoIncoming }) {
  const receiver = request.receiverId;
  const visual = resolvePublicProfileVisual(receiver);
  const isAccepted = request.status === 'accepted';
  const isChatRequest = (request?.requestType || 'connection') === 'chat';

  return (
    <article className="group rounded-3xl border border-rose-200/75 bg-white/95 p-5 shadow-[0_20px_45px_rgba(190,24,93,0.08)] hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(190,24,93,0.14)] transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl overflow-hidden border border-rose-200 bg-rose-50 flex items-center justify-center shrink-0">
          {visual.type === 'photo' ? (
            <img src={visual.value} alt={receiver?.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">{visual.value}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-rose-700 truncate">{receiver?.name || 'Community Member'}</h3>
          <p className="text-sm text-rose-500 truncate">{receiver?.college || 'Your network'}</p>
          <p className="text-xs text-rose-400 mt-1">{isChatRequest ? 'Chat Request' : 'Connection Request'}</p>
          <div className="mt-2 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold"
            style={isAccepted
              ? { borderColor: 'rgba(16,185,129,0.4)', backgroundColor: 'rgba(16,185,129,0.1)', color: '#047857' }
              : { borderColor: 'rgba(244,114,182,0.4)', backgroundColor: 'rgba(244,114,182,0.1)', color: '#be185d' }}
          >
            {isAccepted ? 'accepted' : 'pending'}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2.5">
        <button
          onClick={onViewProfile}
          className="flex-1 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 py-2.5 font-semibold transition"
        >
          View Profile
        </button>
        {!isAccepted ? (
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 py-2.5 font-semibold transition disabled:opacity-50"
          >
            Cancel Request
          </button>
        ) : isChatRequest && request?.conversationId ? (
          <button
            onClick={onStartChat}
            className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 hover:from-rose-600 hover:to-fuchsia-600 text-white py-2.5 font-semibold transition"
          >
            Start Chat
          </button>
        ) : (
          <span className="flex-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 py-2.5 text-center font-semibold text-sm">
            Moved to Connections
          </span>
        )}
      </div>

      {!isAccepted && isChatRequest ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-100 bg-rose-50/70 px-3 py-2">
          <p className="text-xs text-rose-600">Accept is available on the receiver account in Incoming / Chat Requests.</p>
          <button
            type="button"
            onClick={onGoIncoming}
            className="text-xs font-semibold rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-rose-700 hover:bg-rose-100 transition"
          >
            Go to Incoming
          </button>
        </div>
      ) : null}
    </article>
  );
}

export default function RequestsPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [incoming, setIncoming] = React.useState([]);
  const [outgoing, setOutgoing] = React.useState([]);
  const [activeTab, setActiveTab] = React.useState('incoming');
  const [busyRequestId, setBusyRequestId] = React.useState('');
  const [profilePreview, setProfilePreview] = React.useState(null);
  const [toast, setToast] = React.useState('');
  const loadInFlightRef = React.useRef(false);

  const loadRequests = React.useCallback(async ({ silent = false } = {}) => {
    if (loadInFlightRef.current) {
      return;
    }

    try {
      loadInFlightRef.current = true;
      if (!silent) {
        setLoading(true);
      }
      if (!silent) {
        setError('');
      }
      const [incomingResp, outgoingResp] = await Promise.all([
        connectionApi.getIncomingRequests(),
        connectionApi.getOutgoingRequests()
      ]);
      setIncoming(incomingResp?.data?.requests || []);
      setOutgoing(outgoingResp?.data?.requests || []);
    } catch (err) {
      setError(err.message || 'Failed to load requests');
    } finally {
      loadInFlightRef.current = false;
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  React.useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  React.useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadRequests({ silent: true });
      }
    }, 30000);

    const handleFocus = () => {
      void loadRequests({ silent: true });
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void loadRequests({ silent: true });
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadRequests]);

  React.useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      return undefined;
    }

    const socket = io(`${API_URL}/notifications`, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socket.on('chat_request_updated', (payload) => {
      const status = payload?.status;
      if (status === 'accepted') {
        setToast('Your request was accepted');
      } else if (status === 'declined') {
        setToast('Your request was declined');
      } else if (status === 'cancelled') {
        setToast('A request was cancelled');
      }
      window.setTimeout(() => setToast(''), 2600);
      void loadRequests({ silent: true });
    });

    socket.on('chat_request_received', (payload) => {
      const requestType = payload?.requestType === 'chat' ? 'chat' : 'connection';
      setToast(requestType === 'chat' ? 'New chat request received' : 'New connection request received');
      window.setTimeout(() => setToast(''), 2600);
      setActiveTab(requestType === 'chat' ? 'chat' : 'incoming');
      void loadRequests({ silent: true });
    });

    return () => {
      socket.disconnect();
    };
  }, [loadRequests]);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const computeMutualInterests = (otherUser) => {
    const mine = Array.isArray(currentUser?.interests) ? currentUser.interests : [];
    const theirs = Array.isArray(otherUser?.interests) ? otherUser.interests : [];
    const mineSet = new Set(mine.map((i) => String(i).toLowerCase()));
    return theirs.filter((interest) => mineSet.has(String(interest).toLowerCase())).slice(0, 4);
  };

  const handleAccept = async (requestId) => {
    try {
      setBusyRequestId(requestId);
      const response = await connectionApi.acceptRequest(requestId);
      const accepted = incoming.find((item) => item._id === requestId);
      setIncoming((prev) => prev.filter((item) => item._id !== requestId));
      if (accepted) {
        setOutgoing((prev) => [
          {
            ...accepted,
            status: 'accepted',
            receiverId: accepted.senderId
          },
          ...prev
        ]);
      }

      const conversationId = response?.data?.conversation?._id;
      const requestType = response?.data?.requestType || accepted?.requestType || 'connection';

      if (conversationId && requestType === 'chat') {
        showToast('Accepted. Starting chat...');
        window.setTimeout(() => {
          navigate(`/chat?conversationId=${conversationId}`);
        }, 300);
      } else {
        showToast('Accepted. Moved to Connections.');
        window.setTimeout(() => {
          navigate('/connections');
        }, 500);
      }
    } catch (err) {
      setError(err.message || 'Failed to accept request');
    } finally {
      setBusyRequestId('');
    }
  };

  const handleDecline = async (requestId) => {
    try {
      setBusyRequestId(requestId);
      await connectionApi.declineRequest(requestId);
      setIncoming((prev) => prev.filter((item) => item._id !== requestId));
      showToast('Request declined');
    } catch (err) {
      setError(err.message || 'Failed to decline request');
    } finally {
      setBusyRequestId('');
    }
  };

  const handleCancel = async (requestId) => {
    try {
      setBusyRequestId(requestId);
      await connectionApi.cancelRequest(requestId);
      setOutgoing((prev) => prev.filter((item) => item._id !== requestId));
      showToast('Request cancelled');
    } catch (err) {
      setError(err.message || 'Failed to cancel request');
    } finally {
      setBusyRequestId('');
    }
  };

  const incomingCount = incoming.length;
  const chatIncoming = React.useMemo(
    () => incoming.filter((item) => (item?.requestType || 'connection') === 'chat'),
    [incoming]
  );
  const chatIncomingCount = chatIncoming.length;
  const outgoingCount = outgoing.length;

  return (
    <section className="min-h-screen pt-20 pb-24 md:pb-8 bg-[radial-gradient(circle_at_15%_12%,rgba(251,113,133,0.14),transparent_35%),radial-gradient(circle_at_88%_8%,rgba(244,114,182,0.16),transparent_34%),linear-gradient(180deg,#fffafb_0%,#fff7fa_55%,#fff1f6_100%)]">
      {toast ? (
        <div className="fixed top-20 right-4 z-50 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 shadow-lg">
          {toast}
        </div>
      ) : null}

      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="rounded-3xl border border-rose-200/70 bg-white/90 backdrop-blur-sm p-5 md:p-7 shadow-[0_24px_60px_rgba(190,24,93,0.08)]">
          <p className="text-[11px] uppercase tracking-[0.22em] text-rose-500 font-semibold">Requests</p>
          <h1 className="text-3xl md:text-4xl font-bold text-rose-700 mt-1">Connection Invitations</h1>
          <p className="text-sm md:text-base text-rose-500 mt-2">Review incoming requests and track outgoing invites in one premium hub.</p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => setActiveTab('incoming')}
              className={`rounded-2xl border px-4 py-3 text-left transition ${activeTab === 'incoming' ? 'border-rose-300 bg-rose-50 shadow-sm' : 'border-rose-100 bg-white hover:bg-rose-50/60'}`}
            >
              <p className="text-xs uppercase tracking-[0.16em] text-rose-500 font-semibold">Incoming</p>
              <p className="text-2xl font-bold text-rose-700 mt-1">{incomingCount}</p>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`rounded-2xl border px-4 py-3 text-left transition ${activeTab === 'chat' ? 'border-rose-300 bg-rose-50 shadow-sm' : 'border-rose-100 bg-white hover:bg-rose-50/60'}`}
            >
              <p className="text-xs uppercase tracking-[0.16em] text-rose-500 font-semibold">Chat Requests</p>
              <p className="text-2xl font-bold text-rose-700 mt-1">{chatIncomingCount}</p>
            </button>
            <button
              onClick={() => setActiveTab('outgoing')}
              className={`rounded-2xl border px-4 py-3 text-left transition ${activeTab === 'outgoing' ? 'border-rose-300 bg-rose-50 shadow-sm' : 'border-rose-100 bg-white hover:bg-rose-50/60'}`}
            >
              <p className="text-xs uppercase tracking-[0.16em] text-rose-500 font-semibold">Outgoing</p>
              <p className="text-2xl font-bold text-rose-700 mt-1">{outgoingCount}</p>
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="mt-5 space-y-4">
          {loading ? (
            <div className="rounded-3xl border border-rose-200/70 bg-white p-8 text-center text-rose-600">Loading requests...</div>
          ) : activeTab === 'incoming' ? (
            incomingCount ? incoming.map((request) => (
              <IncomingRequestCard
                key={request._id}
                request={request}
                mutualInterests={computeMutualInterests(request.senderId)}
                busy={busyRequestId === request._id}
                onAccept={() => handleAccept(request._id)}
                onDecline={() => handleDecline(request._id)}
                onViewProfile={() => setProfilePreview(request.senderId)}
              />
            )) : <EmptyState type="incoming" />
          ) : activeTab === 'chat' ? (
            chatIncomingCount ? chatIncoming.map((request) => (
              <IncomingRequestCard
                key={request._id}
                request={request}
                mutualInterests={computeMutualInterests(request.senderId)}
                busy={busyRequestId === request._id}
                onAccept={() => handleAccept(request._id)}
                onDecline={() => handleDecline(request._id)}
                onViewProfile={() => setProfilePreview(request.senderId)}
              />
            )) : <EmptyState type="chat" />
          ) : (
            outgoingCount ? outgoing.map((request) => (
              <OutgoingRequestCard
                key={request._id}
                request={request}
                busy={busyRequestId === request._id}
                onCancel={() => handleCancel(request._id)}
                onViewProfile={() => setProfilePreview(request.receiverId)}
                onStartChat={() => navigate(`/chat?conversationId=${request.conversationId}`)}
                onGoIncoming={() => setActiveTab('incoming')}
              />
            )) : <EmptyState type="outgoing" />
          )}
        </div>
      </div>

      <ProfilePreviewModal profile={profilePreview} onClose={() => setProfilePreview(null)} />
      <BottomNav />
    </section>
  );
}
