import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import likesApi from '../services/likesApi';
import chatApi from '../services/chatApi';
import { resolvePublicProfileVisual } from '../utils/profileMedia';

const TAGS = ['Friend', 'Crush', 'Study Buddy', 'Coffee Buddy'];

const formatLastInteraction = (value) => {
  if (!value) return 'No interaction yet';
  const now = Date.now();
  const when = new Date(value).getTime();
  if (!Number.isFinite(when)) return 'No interaction yet';

  const diffMs = Math.max(0, now - when);
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  if (diffMs < hour) return 'Active recently';
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}d ago`;
  return new Date(value).toLocaleDateString();
};

function EmptyConnections() {
  return (
    <div className="rounded-3xl border border-rose-200/75 bg-white/95 p-10 text-center shadow-sm">
      <div className="mx-auto mb-3 w-20 h-20 rounded-full bg-gradient-to-br from-rose-100 to-fuchsia-100 flex items-center justify-center text-4xl">🤝</div>
      <h3 className="text-2xl font-bold text-rose-700">No connections yet</h3>
      <p className="text-sm text-rose-500 mt-2">Accept requests from your Requests page to build your circle.</p>
    </div>
  );
}

function ConnectionCard({
  item,
  view,
  busy,
  onMessage,
  onToggleFavorite,
  onTagChange,
  onRemove
}) {
  const participant = item?.participant || {};
  const visual = resolvePublicProfileVisual(participant);
  const favorite = Boolean(item?.connectionMeta?.favorite);
  const tag = item?.connectionMeta?.tag || 'Friend';
  const lastInteraction = item?.updatedAt || item?.matchedAt || item?.createdAt;

  return (
    <article
      className={`group rounded-3xl border border-rose-200/70 bg-white/95 shadow-[0_18px_45px_rgba(190,24,93,0.08)] hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(190,24,93,0.14)] transition-all duration-300 ${
        view === 'list' ? 'p-4 flex items-center gap-4' : 'p-5'
      }`}
    >
      <button
        type="button"
        onClick={onToggleFavorite}
        disabled={busy}
        className={`absolute opacity-0 group-hover:opacity-100 transition top-4 right-4 rounded-full w-8 h-8 border text-sm flex items-center justify-center ${
          favorite
            ? 'bg-amber-400/20 border-amber-300 text-amber-600 opacity-100'
            : 'bg-white border-rose-200 text-rose-500'
        }`}
        title={favorite ? 'Unfavorite' : 'Mark favorite'}
      >
        {favorite ? '★' : '☆'}
      </button>

      <div className={`rounded-2xl overflow-hidden border border-rose-200 bg-rose-50 flex items-center justify-center shrink-0 ${view === 'list' ? 'w-14 h-14' : 'w-16 h-16'}`}>
        {visual.type === 'photo' ? (
          <img src={visual.value} alt={participant.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl">{visual.value}</span>
        )}
      </div>

      <div className={`min-w-0 ${view === 'list' ? 'flex-1' : ''}`}>
        <h3 className="text-lg font-bold text-rose-700 truncate">{participant.name || 'Community Member'}</h3>
        <p className="text-sm text-rose-500 truncate">{participant.college || 'Your network'}</p>
        <p className="text-xs text-rose-400 mt-1">Last interaction: {formatLastInteraction(lastInteraction)}</p>

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <select
            value={TAGS.includes(tag) ? tag : 'Friend'}
            onChange={(event) => onTagChange(event.target.value)}
            disabled={busy}
            className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs text-rose-700"
          >
            {TAGS.map((entry) => (
              <option key={entry} value={entry}>{entry}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={onMessage}
            disabled={busy}
            className="rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 hover:from-rose-600 hover:to-fuchsia-600 text-white text-xs px-3 py-1.5 font-semibold transition disabled:opacity-60"
          >
            Message
          </button>

          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            className="rounded-full border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-xs px-3 py-1.5 font-semibold transition disabled:opacity-60"
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}

export default function ConnectionsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [toast, setToast] = React.useState('');
  const [connections, setConnections] = React.useState([]);
  const [search, setSearch] = React.useState('');
  const [view, setView] = React.useState('grid');
  const [busyId, setBusyId] = React.useState('');

  const loadConnections = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await likesApi.getConnections(search);
      const rows = response?.connections || [];
      rows.sort((a, b) => new Date(b.updatedAt || b.matchedAt || 0) - new Date(a.updatedAt || a.matchedAt || 0));
      setConnections(rows);
    } catch (err) {
      setError(err.message || 'Failed to load connections');
    } finally {
      setLoading(false);
    }
  }, [search]);

  React.useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const updateMeta = async (matchId, payload) => {
    const previous = [...connections];
    setConnections((prev) => prev.map((item) => item._id === matchId
      ? { ...item, connectionMeta: { ...item.connectionMeta, ...payload } }
      : item));

    try {
      setBusyId(matchId);
      await likesApi.updateConnectionMeta(matchId, payload);
      showToast('Connection updated');
    } catch (err) {
      setConnections(previous);
      setError(err.message || 'Failed to update connection');
    } finally {
      setBusyId('');
    }
  };

  const handleRemove = async (item) => {
    const name = item?.participant?.name || 'this person';
    if (!window.confirm(`Remove connection with ${name}?`)) {
      return;
    }

    try {
      setBusyId(item._id);
      await likesApi.removeConnection(item._id);
      setConnections((prev) => prev.filter((row) => row._id !== item._id));
      showToast('Connection removed');
    } catch (err) {
      setError(err.message || 'Failed to remove connection');
    } finally {
      setBusyId('');
    }
  };

  const handleMessage = async (item) => {
    const participantId = item?.participant?._id;
    if (!participantId) {
      return;
    }

    try {
      setBusyId(item._id);
      const response = await chatApi.createOrGetConversation(participantId);
      const conversationId = response?.data?.conversation?._id || response?.conversation?._id || '';
      if (conversationId) {
        navigate(`/chat?conversationId=${conversationId}`);
      } else {
        navigate(`/chat?participantId=${participantId}`);
      }
    } catch {
      navigate(`/chat?participantId=${participantId}`);
    } finally {
      setBusyId('');
    }
  };

  return (
    <section className="min-h-screen pt-20 pb-24 md:pb-10 bg-[radial-gradient(circle_at_14%_12%,rgba(251,113,133,0.14),transparent_36%),radial-gradient(circle_at_88%_9%,rgba(244,114,182,0.16),transparent_34%),linear-gradient(180deg,#fffafb_0%,#fff8fb_52%,#fff2f7_100%)]">
      {toast ? <div className="fixed top-20 right-4 z-50 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 shadow-lg">{toast}</div> : null}

      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="rounded-3xl border border-rose-200/75 bg-white/90 backdrop-blur-sm p-5 md:p-7 shadow-[0_24px_60px_rgba(190,24,93,0.08)]">
          <p className="text-[11px] uppercase tracking-[0.2em] text-rose-500 font-semibold">Connections</p>
          <h1 className="text-3xl md:text-4xl font-bold text-rose-700 mt-1">Your People</h1>
          <p className="text-sm md:text-base text-rose-500 mt-2">Instagram warmth with Bumble intent. Keep your circle organized and personal.</p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-center">
            <div className="rounded-2xl border border-rose-200 bg-white px-3 py-2.5 flex items-center gap-2">
              <span className="text-rose-500">🔍</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or community"
                className="flex-1 bg-transparent outline-none text-sm text-rose-700 placeholder:text-rose-300"
              />
            </div>

            <button
              type="button"
              onClick={() => setView((prev) => prev === 'grid' ? 'list' : 'grid')}
              className="rounded-2xl border border-rose-200 bg-white hover:bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition"
            >
              {view === 'grid' ? 'Switch to List' : 'Switch to Grid'}
            </button>

            <button
              type="button"
              onClick={() => loadConnections()}
              className="rounded-2xl bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white px-4 py-2.5 text-sm font-semibold hover:from-rose-600 hover:to-fuchsia-600 transition"
            >
              Sort by Recent
            </button>
          </div>
        </div>

        {error ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <div className="mt-5">
          {loading ? (
            <div className="rounded-3xl border border-rose-200/70 bg-white p-8 text-center text-rose-600">Loading connections...</div>
          ) : connections.length === 0 ? (
            <EmptyConnections />
          ) : (
            <div className={view === 'grid' ? 'grid sm:grid-cols-2 gap-4' : 'space-y-3'}>
              {connections.map((item) => (
                <ConnectionCard
                  key={item._id}
                  item={item}
                  view={view}
                  busy={busyId === item._id}
                  onMessage={() => handleMessage(item)}
                  onToggleFavorite={() => updateMeta(item._id, { favorite: !item?.connectionMeta?.favorite })}
                  onTagChange={(tag) => updateMeta(item._id, { tag })}
                  onRemove={() => handleRemove(item)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </section>
  );
}
