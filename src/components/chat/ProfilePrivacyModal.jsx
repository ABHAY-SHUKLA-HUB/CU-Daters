import React from 'react';

export default function ProfilePrivacyModal({
  open,
  loading,
  data,
  actionLoading,
  onClose,
  onRequest,
  onCancelRequest
}) {
  if (!open) {
    return null;
  }

  const preview = data?.preview || {};
  const fullProfile = data?.fullProfile || null;
  const access = data?.access || {};
  const myRequest = access?.myRequest || null;
  const isApproved = Boolean(access?.fullProfileAccess);

  const gallery = Array.isArray(fullProfile?.gallery) ? fullProfile.gallery : [];
  const interests = Array.isArray(fullProfile?.interests) ? fullProfile.interests : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-3xl border border-rose-200/70 bg-white/95 shadow-[0_28px_80px_rgba(152,82,112,0.32)] flex flex-col">
        <div className="px-6 py-4 border-b border-rose-200/60 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-rose-500 font-semibold">Profile Privacy</p>
            <h3 className="text-2xl font-bold text-darkBrown mt-1">{preview.displayName || 'Profile'}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-rose-200 bg-white text-rose-500 hover:bg-rose-50"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-5">
          {loading ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 text-sm text-rose-700">Loading profile...</div>
          ) : (
            <>
              <div className="rounded-2xl border border-rose-200/70 bg-white p-4 flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-48 shrink-0 rounded-2xl overflow-hidden bg-rose-50 border border-rose-200/70 flex items-center justify-center h-48">
                  {preview.displayPhoto ? (
                    <img src={preview.displayPhoto} alt={preview.displayName || 'Profile'} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl">💖</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xl font-bold text-darkBrown">{preview.displayName || 'User'}</p>
                    {preview.age ? <span className="text-sm font-semibold text-softBrown">{preview.age}</span> : null}
                    {preview.verifiedBadge ? <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 font-semibold">✓ Verified</span> : null}
                  </div>
                  <p className="text-sm text-softBrown mt-2">{preview.shortAbout || 'Short intro is private for now.'}</p>
                  <p className="text-xs text-softBrown/80 mt-3">
                    {preview?.basicInfo?.college ? `${preview.basicInfo.college}` : ''}
                    {preview?.basicInfo?.course ? ` • ${preview.basicInfo.course}` : ''}
                    {preview?.basicInfo?.year ? ` • Year ${preview.basicInfo.year}` : ''}
                  </p>
                </div>
              </div>

              {!isApproved ? (
                <div className="rounded-2xl border border-rose-200/70 bg-gradient-to-br from-rose-50/80 to-fuchsia-50/70 p-5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] font-semibold text-rose-500">Full Profile Locked</p>
                      <h4 className="text-lg font-bold text-darkBrown mt-1">Chat is available. Full profile is private.</h4>
                      <p className="text-sm text-softBrown mt-1">Request approval to view detailed bio, interests, prompts, and gallery captions.</p>
                    </div>
                    <span className="text-3xl">🔒</span>
                  </div>

                  <div className="mt-4 grid md:grid-cols-3 gap-3">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="h-28 rounded-xl border border-rose-200/80 bg-white/55 backdrop-blur-md relative overflow-hidden">
                        <div className="absolute inset-0 blur-sm opacity-55" style={{ background: 'linear-gradient(135deg, rgba(251,113,133,0.28), rgba(176,123,172,0.26))' }} />
                        <div className="absolute inset-0 flex items-center justify-center text-rose-500 font-semibold text-xs">Locked Gallery</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    {myRequest?.status === 'pending' ? (
                      <>
                        <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">Request pending</span>
                        <button
                          type="button"
                          onClick={onCancelRequest}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-full border border-rose-200 bg-white text-rose-600 text-xs font-semibold hover:bg-rose-50 disabled:opacity-60"
                        >
                          {actionLoading ? 'Cancelling...' : 'Cancel Request'}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={onRequest}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white text-sm font-semibold shadow hover:brightness-110 disabled:opacity-60"
                      >
                        {actionLoading ? 'Requesting...' : 'Request Full Profile'}
                      </button>
                    )}

                    {myRequest?.status === 'declined' ? (
                      <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">Previous request declined</span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/55 p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] font-semibold text-emerald-600">Full Profile Approved</p>
                      <h4 className="text-lg font-bold text-darkBrown mt-1">Private profile unlocked</h4>
                    </div>
                    <span className="text-xl">🔓</span>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-darkBrown mb-1">Detailed Bio</p>
                    <p className="text-sm text-softBrown">{fullProfile?.detailedBio || 'No detailed bio yet.'}</p>
                  </div>

                  {interests.length > 0 ? (
                    <div>
                      <p className="text-sm font-semibold text-darkBrown mb-2">Interests</p>
                      <div className="flex flex-wrap gap-2">
                        {interests.map((interest, idx) => (
                          <span key={`${interest}-${idx}`} className="px-3 py-1 rounded-full bg-white border border-rose-200 text-xs font-semibold text-darkBrown">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {gallery.length > 0 ? (
                    <div>
                      <p className="text-sm font-semibold text-darkBrown mb-2">Gallery</p>
                      <div className="grid md:grid-cols-3 gap-3">
                        {gallery.map((item) => (
                          <div key={item.id} className="rounded-xl overflow-hidden border border-rose-200 bg-white">
                            <img src={item.imageUrl} alt={item.caption || 'Gallery'} className="w-full h-28 object-cover" />
                            <p className="text-xs text-softBrown px-2.5 py-2 line-clamp-2">{item.caption || 'No caption'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
