import React, { useState, useEffect, useCallback } from 'react';
import connectionApi from '../services/connectionApi';

export default function LikeRequests({ onAcceptSuccess, onRejectSuccess }) {
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedProfile, setExpandedProfile] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [recentMatch, setRecentMatch] = useState(null);
  const [activeTab, setActiveTab] = useState('incoming');
  const fetchInFlightRef = React.useRef(false);

  const fetchRequests = useCallback(async (silent = false) => {
    if (fetchInFlightRef.current) {
      return;
    }

    try {
      fetchInFlightRef.current = true;
      if (!silent) {
        setLoading(true);
      }
      const [incomingData, sentData] = await Promise.all([
        connectionApi.getIncomingRequests(),
        connectionApi.getOutgoingRequests()
      ]);
      setRequests(incomingData?.data?.requests || []);
      setSentRequests((sentData?.data?.requests || []).filter((item) => item.status === 'pending'));
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err.message || 'Failed to load requests');
    } finally {
      fetchInFlightRef.current = false;
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchRequests(true);
      }
    }, 30000);

    const handleFocus = () => {
      void fetchRequests(true);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void fetchRequests(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchRequests]);

  const handleAccept = async (requestId) => {
    try {
      setActionInProgress(true);
      setError('');
      const acceptedItem = requests.find((item) => item._id === requestId);
      const response = await connectionApi.acceptRequest(requestId);
      const matchedUserName = acceptedItem?.senderId?.name || 'your match';
      const conversationId = response?.data?.conversation?._id || '';
      setRecentMatch({ name: matchedUserName, conversationId });

      // Remove from list after accepting
      setRequests(requests.filter((r) => r._id !== requestId));
      setExpandedProfile(null);
      onAcceptSuccess?.({
        like: {
          likedBy: { name: matchedUserName }
        },
        conversation: response?.data?.conversation || null,
        matchedUser: acceptedItem?.senderId || null
      });
    } catch (err) {
      console.error('Error accepting request:', err);
      setError(err.message || 'Failed to accept request');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleReject = async (requestId) => {
    try {
      setActionInProgress(true);
      setError('');
      await connectionApi.declineRequest(requestId);
      // Remove from list after rejecting
      setRequests(requests.filter((r) => r._id !== requestId));
      setExpandedProfile(null);
      onRejectSuccess?.();
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError(err.message || 'Failed to decline request');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleCancel = async (requestId) => {
    try {
      setActionInProgress(true);
      setError('');
      await connectionApi.cancelRequest(requestId);
      setSentRequests((prev) => prev.filter((item) => item._id !== requestId));
      setExpandedProfile(null);
    } catch (err) {
      console.error('Error cancelling request:', err);
      setError(err.message || 'Failed to cancel request');
    } finally {
      setActionInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-softBrown">Loading requests...</p>
      </div>
    );
  }

  const visibleList = activeTab === 'incoming' ? requests : sentRequests;

  return (
    <div className="space-y-4 p-6 bg-gradient-to-b from-rose-50 via-white to-[#fff8fb] rounded-2xl border border-rose-100/90 shadow-sm">
      {recentMatch ? (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 rounded-lg shadow-lg text-white">
          <h3 className="text-lg font-black">🎉 You matched with {recentMatch.name}!</h3>
          <p className="text-emerald-100 text-sm mt-1">Say hi to start the conversation now.</p>
          {recentMatch.conversationId ? (
            <button
              onClick={() => onAcceptSuccess?.({ conversation: { _id: recentMatch.conversationId } })}
              className="mt-3 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 border border-white/35 text-sm font-bold"
            >
              Start Chat
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="bg-gradient-to-r from-rose-500 to-fuchsia-500 p-4 rounded-2xl shadow-md text-white">
        <p className="text-[11px] uppercase tracking-[0.18em] text-rose-100/90">Requests Center</p>
        <h2 className="text-2xl font-black mt-1">Meaningful invites, not random noise</h2>
        <p className="text-rose-100 text-sm mt-1">Accept only when you feel the vibe. Chat unlocks instantly after acceptance.</p>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-white/85 border border-rose-200/70 p-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('incoming')}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${activeTab === 'incoming' ? 'bg-rose-500 text-white shadow-sm' : 'text-rose-700 hover:bg-rose-50'}`}
        >
          Incoming ({requests.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('outgoing')}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${activeTab === 'outgoing' ? 'bg-rose-500 text-white shadow-sm' : 'text-rose-700 hover:bg-rose-50'}`}
        >
          Outgoing ({sentRequests.length})
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {visibleList.length === 0 ? (
        <div className="rounded-2xl border border-rose-200/70 bg-white px-5 py-10 text-center">
          <p className="text-3xl mb-2">{activeTab === 'incoming' ? '💌' : '📨'}</p>
          <p className="text-base font-semibold text-rose-700">
            {activeTab === 'incoming' ? 'No incoming requests right now' : 'No outgoing requests pending'}
          </p>
          <p className="text-sm text-rose-500 mt-1">
            {activeTab === 'incoming' ? 'Discover profiles and send a respectful request to start new connections.' : 'Your requests will appear here until accepted or declined.'}
          </p>
        </div>
      ) : null}

      <div className="space-y-4">
        {visibleList.map((request) => {
          const requester = activeTab === 'incoming' ? request.senderId : request.receiverId;
          const isExpanded = expandedProfile === request._id;
          const commonInterests = (requester?.interests || []).slice(0, 3);
          const isChatRequest = (request?.requestType || 'connection') === 'chat';

          return (
            <div
              key={request._id}
              className="bg-white rounded-2xl shadow-sm overflow-hidden border border-rose-100 hover:shadow-md transition"
            >
              {/* Collapsed View - Mini Profile */}
              <div className="p-4 cursor-pointer hover:bg-rose-50/70 transition" onClick={() => setExpandedProfile(isExpanded ? null : request._id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Profile Image */}
                    {requester.profilePhoto && (
                      <img
                        src={requester.profilePhoto}
                        alt={requester.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-800">{requester?.name || 'Campus Member'}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1.5">
                        <span>{requester?.college ? `📍 ${requester.college}` : 'Campus Member'}</span>
                        <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] text-rose-700">
                          {isChatRequest ? 'Chat Request' : 'Connection Request'}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">Verified</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-xl">{isExpanded ? '▼' : '▶'}</div>
                </div>
              </div>

              {/* Expanded View - Full Profile */}
              {isExpanded && (
                <div className="border-t border-rose-200 p-4 bg-gradient-to-b from-white via-rose-50/40 to-white">
                  {/* Full Profile Details */}
                  <div className="space-y-4">
                    {/* Age, Course, Year */}
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Age</p>
                        <p className="font-semibold">{requester.age || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Gender</p>
                        <p className="font-semibold">{requester.gender || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Year</p>
                        <p className="font-semibold">{requester.year || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Course & College */}
                    {requester.course && (
                      <div>
                        <p className="text-gray-600">Course</p>
                        <p className="font-semibold">{requester.course}</p>
                      </div>
                    )}

                    {requester.college && (
                      <div>
                        <p className="text-gray-600">College</p>
                        <p className="font-semibold">{requester.college}</p>
                      </div>
                    )}

                    {/* Bio */}
                    {requester.bio && (
                      <div>
                        <p className="text-gray-600">Intro</p>
                        <p className="text-sm text-gray-700 bg-white p-2.5 rounded-lg border border-rose-100">
                          {requester.bio}
                        </p>
                      </div>
                    )}

                    {/* Interest chips */}
                    {commonInterests.length ? (
                      <div className="flex flex-wrap gap-2">
                        {commonInterests.map((interest) => (
                          <span key={interest} className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs text-rose-700">
                            {interest}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {/* Full Profile Photo */}
                    {requester.profilePhoto && (
                      <div>
                        <img
                          src={requester.profilePhoto}
                          alt={requester.name}
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Action Buttons - Prominent & Highlighted */}
                    {activeTab === 'incoming' ? (
                      <div className="flex gap-3 pt-5 border-t border-rose-200">
                        <button
                          onClick={() => handleReject(request._id)}
                          disabled={actionInProgress}
                          className="flex-1 px-4 py-3 bg-white hover:bg-rose-50 text-rose-700 font-bold rounded-xl transition disabled:opacity-50 border border-rose-200"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleAccept(request._id)}
                          disabled={actionInProgress}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-500 to-fuchsia-500 hover:from-rose-600 hover:to-fuchsia-600 text-white font-bold rounded-xl transition disabled:opacity-50"
                        >
                          {isChatRequest ? 'Accept and Start Chat' : 'Accept and Connect'}
                        </button>
                      </div>
                    ) : (
                      <div className="pt-4 border-t border-rose-200 space-y-2">
                        <p className="text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                          Request pending. They can accept or decline from their Requests screen.
                        </p>
                        <button
                          onClick={() => handleCancel(request._id)}
                          disabled={actionInProgress}
                          className="w-full px-3 py-2 rounded-lg border border-rose-200 text-rose-700 bg-white hover:bg-rose-50 text-sm font-semibold disabled:opacity-50"
                        >
                          Cancel Request
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
