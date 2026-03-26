import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import authApi from '../services/authApi';
import safetyApi from '../services/safetyApi';
import profileAccessApi from '../services/profileAccessApi';
import { AVATAR_PRESETS, resolvePublicProfileVisual } from '../utils/profileMedia';
import { useAuth } from '../context/AuthContext';
import PhotoPreviewModal from '../components/PhotoPreviewModal';

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading, updateUser } = useAuth();
  const viewUserId = searchParams.get('viewUserId') || '';
  const isViewingAnotherProfile = Boolean(viewUserId && user?._id && String(viewUserId) !== String(user._id));
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    collegeEmail: '',
    shortAbout: '',
    bio: '',
    detailedBio: '',
    prompts: [],
    gallery: [],
    interests: [],
    phone: '',
    privacy: {
      profileVisibility: 'everyone',
      showOnlineStatus: true,
      allowDiscovery: true,
      allowRequests: true,
      showVerifiedBadge: true,
      fullProfile: {
        requireSeparateApproval: true,
        requestCooldownHours: 72,
        onlyVerifiedRequesters: false,
        onlyConnectedUsers: true,
        sameCollegeOnly: false,
        autoDeclineUnknownUsers: false
      }
    }
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [avatarConfig, setAvatarConfig] = useState({
    preset: '',
    faceShape: 'round',
    hair: 'short',
    outfit: 'casual'
  });
  const [saving, setSaving] = useState(false);
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [incomingProfileRequests, setIncomingProfileRequests] = useState([]);
  const [outgoingProfileRequests, setOutgoingProfileRequests] = useState([]);
  const [approvedViewers, setApprovedViewers] = useState([]);
  const [message, setMessage] = useState('');
  const [viewProfileLoading, setViewProfileLoading] = useState(false);
  const [viewProfileActionLoading, setViewProfileActionLoading] = useState(false);
  const [viewProfileData, setViewProfileData] = useState(null);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [viewerGalleryModalOpen, setViewerGalleryModalOpen] = useState(false);
  const [viewerGalleryIndex, setViewerGalleryIndex] = useState(0);
  const previousApprovalRef = React.useRef(false);
  const unlockTimerRef = React.useRef(null);

  const fallbackViewerProfile = React.useMemo(() => {
    const participant = location?.state?.profilePreview || null;
    if (!participant || typeof participant !== 'object') {
      return null;
    }

    return {
      preview: {
        userId: participant?._id || viewUserId,
        displayPhoto: participant?.profilePhoto || participant?.livePhoto || null,
        displayName: participant?.name || 'User',
        age: participant?.age || null,
        shortAbout: participant?.shortAbout || participant?.bio || '',
        verifiedBadge: Boolean(
          participant?.verified_badge ||
          participant?.is_verified ||
          participant?.college_verification_status === 'verified'
        ),
        basicInfo: {
          college: participant?.college || '',
          course: participant?.course || '',
          year: participant?.year || ''
        }
      },
      fullProfile: null,
      access: {
        chatAvailable: true,
        fullProfileAccess: false,
        fullProfileStatus: 'locked',
        requiresApproval: true,
        myRequest: null
      }
    };
  }, [location?.state?.profilePreview, viewUserId]);

  // Fetch current user on mount
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    setCurrentUser(user);
    setFormData({
      name: user.name || '',
      age: user.age || '',
      email: user.email || '',
      collegeEmail: user.collegeEmail || '',
      shortAbout: user.shortAbout || '',
      bio: user.bio || '',
      detailedBio: user.detailedBio || '',
      prompts: Array.isArray(user.prompts) ? user.prompts : [],
      gallery: Array.isArray(user.gallery) ? user.gallery : [],
      interests: user.interests || [],
      phone: user.phone || '',
      privacy: {
        profileVisibility: user?.privacy?.profileVisibility || 'everyone',
        showOnlineStatus: user?.privacy?.showOnlineStatus !== false,
        allowDiscovery: user?.privacy?.allowDiscovery !== false,
        allowRequests: user?.privacy?.allowRequests !== false,
        showVerifiedBadge: user?.privacy?.showVerifiedBadge !== false,
        fullProfile: {
          requireSeparateApproval: user?.privacy?.fullProfile?.requireSeparateApproval !== false,
          requestCooldownHours: Number(user?.privacy?.fullProfile?.requestCooldownHours || 72),
          onlyVerifiedRequesters: Boolean(user?.privacy?.fullProfile?.onlyVerifiedRequesters),
          onlyConnectedUsers: user?.privacy?.fullProfile?.onlyConnectedUsers !== false,
          sameCollegeOnly: Boolean(user?.privacy?.fullProfile?.sameCollegeOnly),
          autoDeclineUnknownUsers: Boolean(user?.privacy?.fullProfile?.autoDeclineUnknownUsers)
        }
      }
    });
    if (user.profilePhoto) {
      setProfilePhotoPreview(user.profilePhoto);
    }
    setAvatarConfig({
      preset: user?.avatarConfig?.preset || '',
      faceShape: user?.avatarConfig?.faceShape || 'round',
      hair: user?.avatarConfig?.hair || 'short',
      outfit: user?.avatarConfig?.outfit || 'casual'
    });
  }, [authLoading, navigate, user]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePrivacyToggle = (key) => {
    setFormData((prev) => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: !prev.privacy[key]
      }
    }));
  };

  const loadProfileAccessDashboard = async () => {
    try {
      setPrivacyLoading(true);
      const [incoming, outgoing, viewers] = await Promise.all([
        profileAccessApi.getIncomingRequests(),
        profileAccessApi.getOutgoingRequests(),
        profileAccessApi.getApprovedViewers()
      ]);
      setIncomingProfileRequests(incoming.requests || []);
      setOutgoingProfileRequests(outgoing.requests || []);
      setApprovedViewers(viewers.viewers || []);
    } catch (error) {
      console.error('Error loading profile access dashboard:', error);
    } finally {
      setPrivacyLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      void loadProfileAccessDashboard();
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading || !user || !isViewingAnotherProfile) {
      return;
    }

    let active = true;

    const fetchViewedProfile = async () => {
      try {
        setViewProfileLoading(true);
        const previousApproved = previousApprovalRef.current;
        const response = await profileAccessApi.getProfileView(viewUserId);
        if (!active) {
          return;
        }

        const nextData = response?.data || null;
        const nowApproved = Boolean(nextData?.access?.fullProfileAccess);
        previousApprovalRef.current = nowApproved;
        if (!previousApproved && nowApproved) {
          setJustUnlocked(true);
          if (unlockTimerRef.current) {
            clearTimeout(unlockTimerRef.current);
          }
          unlockTimerRef.current = setTimeout(() => setJustUnlocked(false), 1200);
        }
        setViewProfileData(nextData);
      } catch (error) {
        if (active) {
          const errorText = String(error?.message || '').toLowerCase();
          const isRouteNotFound = errorText.includes('route') && errorText.includes('not found');

          if (isRouteNotFound && fallbackViewerProfile) {
            setViewProfileData(fallbackViewerProfile);
            setMessage('Private profile details are temporarily unavailable. Basic profile preview is shown.');
          } else {
            setMessage(error.message || 'Unable to load profile');
          }
        }
      } finally {
        if (active) {
          setViewProfileLoading(false);
        }
      }
    };

    void fetchViewedProfile();

    return () => {
      active = false;
      if (unlockTimerRef.current) {
        clearTimeout(unlockTimerRef.current);
        unlockTimerRef.current = null;
      }
    };
  }, [authLoading, fallbackViewerProfile, isViewingAnotherProfile, user, viewUserId]);

  const handleRequestFullProfileFromView = async () => {
    try {
      setViewProfileActionLoading(true);
      await profileAccessApi.requestFullProfile(viewUserId, 'I would like to know you better.');
      const response = await profileAccessApi.getProfileView(viewUserId);
      setViewProfileData(response?.data || null);
      setMessage('Full profile request sent ✅');
    } catch (error) {
      const errorText = String(error?.message || '').toLowerCase();
      const isRouteNotFound = errorText.includes('route') && errorText.includes('not found');
      if (isRouteNotFound) {
        setMessage('Profile access service is temporarily unavailable. Please try again in a moment.');
      } else {
        setMessage(error.message || 'Unable to send full profile request');
      }
    } finally {
      setViewProfileActionLoading(false);
    }
  };

  const handleCancelRequestFromView = async () => {
    const requestId = viewProfileData?.access?.myRequest?.id;
    if (!requestId) {
      return;
    }

    try {
      setViewProfileActionLoading(true);
      await profileAccessApi.cancelRequest(requestId);
      const response = await profileAccessApi.getProfileView(viewUserId);
      setViewProfileData(response?.data || null);
      setMessage('Request cancelled');
    } catch (error) {
      setMessage(error.message || 'Unable to cancel request');
    } finally {
      setViewProfileActionLoading(false);
    }
  };

  const handlePromptChange = (index, key, value) => {
    setFormData((prev) => {
      const nextPrompts = [...(prev.prompts || [])];
      nextPrompts[index] = {
        ...(nextPrompts[index] || { question: '', answer: '' }),
        [key]: value
      };
      return {
        ...prev,
        prompts: nextPrompts
      };
    });
  };

  const addPrompt = () => {
    setFormData((prev) => ({
      ...prev,
      prompts: [...(prev.prompts || []), { question: '', answer: '' }].slice(0, 8)
    }));
  };

  const removePrompt = (index) => {
    setFormData((prev) => ({
      ...prev,
      prompts: (prev.prompts || []).filter((_, idx) => idx !== index)
    }));
  };

  const addGalleryItem = () => {
    setFormData((prev) => ({
      ...prev,
      gallery: [...(prev.gallery || []), { imageUrl: '', caption: '', order: (prev.gallery || []).length }].slice(0, 12)
    }));
  };

  const handleGalleryChange = (index, key, value) => {
    setFormData((prev) => {
      const nextGallery = [...(prev.gallery || [])];
      nextGallery[index] = {
        ...(nextGallery[index] || { imageUrl: '', caption: '', order: index }),
        [key]: key === 'order' ? Number(value || 0) : value
      };
      return {
        ...prev,
        gallery: nextGallery
      };
    });
  };

  const removeGalleryItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      gallery: (prev.gallery || []).filter((_, idx) => idx !== index)
    }));
  };

  const handleProfileRequestAction = async (requestId, action) => {
    try {
      setSaving(true);
      if (action === 'approve') {
        await profileAccessApi.approveRequest(requestId, 'Approved by profile owner');
      } else if (action === 'decline') {
        await profileAccessApi.declineRequest(requestId, 'Not comfortable sharing full profile right now');
      }
      await loadProfileAccessDashboard();
      setMessage(`Profile request ${action}d successfully ✅`);
    } catch (error) {
      setMessage(error.message || `Unable to ${action} request`);
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeViewer = async (viewerId) => {
    try {
      setSaving(true);
      await profileAccessApi.revokeViewerAccess(viewerId);
      await loadProfileAccessDashboard();
      setMessage('Full profile access revoked ✅');
    } catch (error) {
      setMessage(error.message || 'Unable to revoke access');
    } finally {
      setSaving(false);
    }
  };

  // Handle profile picture upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage('File size should be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setMessage('Please upload an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target.result;
        setProfilePhoto(base64String);
        setProfilePhotoPreview(base64String);
        setMessage('');
      };
      reader.onerror = () => {
        setMessage('Error reading file');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle interest toggle
  const toggleInterest = (interest) => {
    setFormData(prev => {
      const interests = prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests };
    });
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setMessage('');

      const updates = {
        ...formData,
        age: formData.age ? Number(formData.age) : undefined,
        avatarConfig
      };

      // Only include profilePhoto if it was changed
      if (profilePhoto) {
        updates.profilePhoto = profilePhoto;
      }

      // Call API to update profile
      const response = await authApi.updateProfile(updates);
      await profileAccessApi.updateSettings(formData.privacy.fullProfile);

      await safetyApi.updatePrivacy(formData.privacy);
      
      if (response.success) {
        const updatedUser = { ...currentUser, ...updates };
        updateUser(updatedUser);
        setCurrentUser(updatedUser);
        setMessage('Profile updated successfully! ✅');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setMessage(response.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage(err.message || 'Error updating profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (isViewingAnotherProfile) {
    const preview = viewProfileData?.preview || {};
    const fullProfile = viewProfileData?.fullProfile || null;
    const access = viewProfileData?.access || {};
    const isApproved = Boolean(access?.fullProfileAccess);
    const requestStatus = access?.myRequest?.status || '';
    const lockCardBase = 'relative rounded-2xl border border-rose-200/80 bg-white/85 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg';

    return (
      <div className="pb-24 md:pb-0 pt-20 bg-[radial-gradient(circle_at_12%_12%,rgba(251,113,133,0.18),transparent_34%),radial-gradient(circle_at_85%_10%,rgba(176,123,172,0.16),transparent_32%),linear-gradient(180deg,#fffafd_0%,#fff7fb_58%,#fff2f8_100%)] min-h-screen">
        <div className="px-4 md:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex items-center justify-between gap-3">
              <button
                onClick={() => navigate(-1)}
                className="text-blushPink font-semibold hover:text-softPink transition"
              >
                ← Back
              </button>
              <span className="px-3 py-1 rounded-full text-xs font-semibold border border-rose-200 bg-white/90 text-rose-600">Private Profile View</span>
            </div>

            {message ? (
              <div className="mb-5 p-3.5 rounded-2xl text-sm font-semibold text-center bg-white border border-rose-200 text-rose-700">
                {message}
              </div>
            ) : null}

            <div className={`rounded-3xl border border-rose-200/80 bg-white/90 shadow-[0_24px_70px_rgba(190,24,93,0.14)] p-5 md:p-7 ${justUnlocked ? 'animate-bounce-in' : ''}`}>
              {viewProfileLoading ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 text-softBrown">Loading profile...</div>
              ) : (
                <>
                  <div className="grid md:grid-cols-[220px_minmax(0,1fr)] gap-5 items-start">
                    <div className="rounded-2xl overflow-hidden border border-rose-200 bg-rose-50 h-[240px]">
                      {preview?.displayPhoto ? (
                        <img src={preview.displayPhoto} alt={preview.displayName || 'Profile'} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">💖</div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-3xl md:text-4xl font-bold text-darkBrown">{preview?.displayName || 'User'}</h1>
                        {preview?.age ? <span className="text-lg font-semibold text-softBrown">{preview.age}</span> : null}
                        {preview?.verifiedBadge ? <span className="px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-600 text-xs font-semibold">✓ Verified</span> : null}
                      </div>
                      <p className="mt-2 text-softBrown">{preview?.shortAbout || 'Short intro unavailable.'}</p>
                      <p className="mt-3 text-xs text-softBrown/80">
                        {preview?.basicInfo?.college ? `${preview.basicInfo.college}` : ''}
                        {preview?.basicInfo?.course ? ` • ${preview.basicInfo.course}` : ''}
                        {preview?.basicInfo?.year ? ` • Year ${preview.basicInfo.year}` : ''}
                      </p>

                      <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/70 px-3.5 py-2.5 text-sm font-medium text-rose-700">
                        {access?.chatAvailable ? 'You can chat, but full profile requires approval' : 'Chat is not unlocked yet. Full profile also requires approval'}
                      </div>

                      <div className="mt-4 flex items-center gap-2 flex-wrap">
                        {!isApproved ? (
                          requestStatus === 'pending' ? (
                            <>
                              <button
                                type="button"
                                disabled
                                className="px-4 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_20px_rgba(245,158,11,0.35)]"
                              >
                                Requested / Pending Approval
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelRequestFromView}
                                disabled={viewProfileActionLoading}
                                className="px-3 py-1.5 rounded-full text-xs font-semibold border border-rose-200 bg-white text-rose-600"
                              >
                                {viewProfileActionLoading ? 'Cancelling...' : 'Cancel'}
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={handleRequestFullProfileFromView}
                              disabled={viewProfileActionLoading}
                              className="px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-fuchsia-500 shadow-[0_0_24px_rgba(236,72,153,0.38)] hover:brightness-110 transition"
                            >
                              {viewProfileActionLoading ? 'Requesting...' : 'Request Full Profile'}
                            </button>
                          )
                        ) : (
                          <span className="px-4 py-2 rounded-full text-sm font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 animate-fade-in-up">
                            🔓 Full Profile Unlocked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid md:grid-cols-2 gap-4">
                    <section className={lockCardBase}>
                      <div className="p-4">
                        <p className="text-sm font-semibold text-darkBrown mb-2">Additional Photos</p>
                        {isApproved ? (
                          <div className="grid grid-cols-3 gap-2">
                            {(fullProfile?.gallery || []).slice(0, 6).map((item, index) => (
                              <button
                                type="button"
                                key={item.id || `view-gallery-${index}`}
                                onClick={() => {
                                  setViewerGalleryIndex(index);
                                  setViewerGalleryModalOpen(true);
                                }}
                                className="rounded-lg overflow-hidden border border-rose-200 bg-white hover:-translate-y-0.5 transition"
                              >
                                <img src={item.imageUrl} alt={item.caption || 'Gallery'} className="w-full h-20 object-cover" />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3].map((idx) => (
                              <div key={idx} className="h-20 rounded-lg border border-rose-200 bg-gradient-to-br from-rose-200/40 to-fuchsia-200/40 blur-[1.5px]" />
                            ))}
                          </div>
                        )}
                      </div>
                      {!isApproved ? <LockedOverlay /> : null}
                    </section>

                    <section className={lockCardBase}>
                      <div className="p-4">
                        <p className="text-sm font-semibold text-darkBrown mb-2">Detailed Bio</p>
                        <p className="text-sm text-softBrown">
                          {isApproved
                            ? (fullProfile?.detailedBio || 'No detailed bio shared yet.')
                            : 'A richer personal story is available after profile owner approval.'}
                        </p>
                      </div>
                      {!isApproved ? <LockedOverlay /> : null}
                    </section>

                    <section className={lockCardBase}>
                      <div className="p-4">
                        <p className="text-sm font-semibold text-darkBrown mb-2">Interests</p>
                        <div className="flex flex-wrap gap-2">
                          {isApproved
                            ? (fullProfile?.interests || []).slice(0, 8).map((interest, idx) => (
                                <span key={`${interest}-${idx}`} className="px-2.5 py-1 rounded-full border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700">{interest}</span>
                              ))
                            : ['Music', 'Travel', 'City Life', 'Coffee'].map((interest) => (
                                <span key={interest} className="px-2.5 py-1 rounded-full border border-rose-200 bg-rose-50 text-xs font-semibold text-rose-700 blur-[1px]">{interest}</span>
                              ))}
                        </div>
                      </div>
                      {!isApproved ? <LockedOverlay /> : null}
                    </section>

                    <section className={lockCardBase}>
                      <div className="p-4">
                        <p className="text-sm font-semibold text-darkBrown mb-2">Prompts</p>
                        {isApproved ? (
                          <div className="space-y-2">
                            {(fullProfile?.prompts || []).slice(0, 3).map((prompt, idx) => (
                              <div key={`prompt-view-${idx}`} className="rounded-lg border border-rose-200 bg-rose-50/60 px-3 py-2">
                                <p className="text-xs font-semibold text-rose-700">{prompt.question || 'Prompt'}</p>
                                <p className="text-xs text-softBrown mt-1">{prompt.answer || '—'}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {[1, 2].map((idx) => (
                              <div key={idx} className="rounded-lg border border-rose-200 bg-rose-50/60 px-3 py-2 blur-[1.2px]">
                                <p className="text-xs font-semibold text-rose-700">Prompt title</p>
                                <p className="text-xs text-softBrown mt-1">Prompt answer preview</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {!isApproved ? <LockedOverlay /> : null}
                    </section>
                  </div>
                </>
              )}
            </div>

            <PhotoPreviewModal
              isOpen={viewerGalleryModalOpen}
              photos={(fullProfile?.gallery || []).map((item) => item.imageUrl).filter(Boolean)}
              captions={(fullProfile?.gallery || []).map((item) => item.caption || '')}
              initialIndex={viewerGalleryIndex}
              onClose={() => setViewerGalleryModalOpen(false)}
              userName={preview?.displayName || 'Profile'}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-0 pt-20 min-h-screen bg-[radial-gradient(circle_at_12%_12%,rgba(251,113,133,0.18),transparent_34%),radial-gradient(circle_at_86%_8%,rgba(176,123,172,0.16),transparent_30%),linear-gradient(180deg,#fffafd_0%,#fff7fb_56%,#fff2f8_100%)]">
      <div className="px-4 md:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-rose-500 font-semibold mb-3 hover:text-rose-600 transition"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#3e1f35]">Build Your Profile</h1>
              <p className="text-[#825a72] text-base md:text-lg mt-2">A premium, expressive profile experience. Everything is editable, polished, and social-first.</p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-white/85 px-4 py-2 text-sm font-semibold text-rose-600 shadow-sm">Profile Completion Mode</div>
          </div>

          {message && (
            <div className={`mb-5 p-4 rounded-2xl text-center font-semibold border ${
              message.includes('✅')
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-5">
            <SectionCard title="Profile Media" subtitle="Hero section for your first impression" icon="🖼">
              <div className="rounded-3xl border border-rose-200/80 p-5 md:p-6 bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(255,236,245,0.8))] shadow-[0_24px_60px_rgba(190,24,93,0.12)]">
                <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] gap-6 items-start">
                  <div className="relative">
                    <div className="absolute -inset-2 rounded-[2rem] bg-gradient-to-br from-rose-300/40 via-fuchsia-300/20 to-pink-300/30 blur-xl" />
                    <div className="relative w-full aspect-square rounded-[1.8rem] overflow-hidden border border-white/70 bg-white shadow-[0_24px_48px_rgba(190,24,93,0.24)]">
                      {profilePhotoPreview ? (
                        <img
                          src={profilePhotoPreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-rose-100 via-fuchsia-100 to-indigo-100 flex items-center justify-center text-7xl">
                          {resolvePublicProfileVisual({ gender: currentUser?.gender, avatarConfig }).value}
                        </div>
                      )}
                      <button
                        type="button"
                        className="absolute bottom-3 right-3 rounded-full px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-fuchsia-500 shadow-[0_0_20px_rgba(244,114,182,0.45)] hover:brightness-110 transition active:scale-95"
                      >
                        ✨ Edit Photo
                      </button>
                    </div>
                    <p className="text-xs text-center text-[#8a667d] mt-3">{profilePhotoPreview ? 'Current profile photo' : 'Avatar preview'}</p>
                  </div>

                  <div className="space-y-4">
                    <label className="block">
                      <div className="rounded-2xl border-2 border-dashed border-rose-300 bg-white/70 hover:bg-white transition p-6 text-center cursor-pointer">
                        <p className="text-5xl mb-2">📸</p>
                        <p className="font-bold text-[#442438]">Upload a standout photo</p>
                        <p className="text-xs text-[#8a667d] mt-1">PNG, JPG, GIF up to 5MB</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>

                    <div className="rounded-2xl border border-rose-200 bg-white/75 p-4">
                      <p className="text-xs uppercase tracking-[0.14em] font-semibold text-rose-500">Avatar Preset</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {AVATAR_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => setAvatarConfig((prev) => ({ ...prev, preset: preset.id }))}
                            className={`px-3 py-2 rounded-full border text-xs font-semibold transition ${
                              avatarConfig.preset === preset.id
                                ? 'border-rose-400 bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white shadow-[0_0_16px_rgba(244,114,182,0.38)]'
                                : 'border-rose-200 bg-white text-rose-700 hover:-translate-y-0.5'
                            }`}
                          >
                            <span className="mr-1.5">{preset.emoji}</span>
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      <div className="mt-4 grid sm:grid-cols-3 gap-3">
                        <select
                          value={avatarConfig.faceShape}
                          onChange={(e) => setAvatarConfig((prev) => ({ ...prev, faceShape: e.target.value }))}
                          className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-[#43293a] focus:outline-none focus:ring-2 focus:ring-rose-300"
                        >
                          <option value="round">Face: Round</option>
                          <option value="oval">Face: Oval</option>
                          <option value="square">Face: Square</option>
                        </select>
                        <select
                          value={avatarConfig.hair}
                          onChange={(e) => setAvatarConfig((prev) => ({ ...prev, hair: e.target.value }))}
                          className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-[#43293a] focus:outline-none focus:ring-2 focus:ring-rose-300"
                        >
                          <option value="short">Hair: Short</option>
                          <option value="long">Hair: Long</option>
                          <option value="curly">Hair: Curly</option>
                          <option value="bald">Hair: Bald</option>
                        </select>
                        <select
                          value={avatarConfig.outfit}
                          onChange={(e) => setAvatarConfig((prev) => ({ ...prev, outfit: e.target.value }))}
                          className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-[#43293a] focus:outline-none focus:ring-2 focus:ring-rose-300"
                        >
                          <option value="casual">Outfit: Casual</option>
                          <option value="formal">Outfit: Formal</option>
                          <option value="sporty">Outfit: Sporty</option>
                          <option value="traditional">Outfit: Traditional</option>
                        </select>
                      </div>
                    </div>

                    <p className="text-xs text-[#866177]">ℹ Verification live photo remains private. This upload/avatar is shown as your public preview.</p>
                  </div>
                </div>
              </div>
            </SectionCard>

            <div className="grid lg:grid-cols-2 gap-5">
              <SectionCard title="Public Identity" subtitle="How people first discover you" icon="🪪">
                <div className="space-y-4">
                  <FloatingInput label="Full Name" name="name" value={formData.name} onChange={handleInputChange} />
                  <FloatingInput label="Age" name="age" type="number" min="17" max="99" value={formData.age} onChange={handleInputChange} />
                  <FloatingInput label="Email" name="email" type="email" value={formData.email} disabled />
                  <FloatingInput label="College Email" name="collegeEmail" type="email" value={formData.collegeEmail} onChange={handleInputChange} />
                  <FloatingInput label="Phone (Optional)" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} />
                </div>
              </SectionCard>

              <SectionCard title="About & Personality" subtitle="Give your profile emotional depth" icon="✨">
                <div className="space-y-4">
                  <FloatingTextarea
                    label="Public Short About"
                    name="shortAbout"
                    value={formData.shortAbout}
                    onChange={handleInputChange}
                    rows={2}
                    maxLength={160}
                  />
                  <p className="text-[11px] text-[#916c82] -mt-2">{String(formData.shortAbout || '').length}/160</p>

                  <FloatingTextarea
                    label="About You"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-[11px] text-[#916c82] -mt-2">{String(formData.bio || '').length}/500</p>

                  <FloatingTextarea
                    label="Detailed Bio (Locked Full Profile)"
                    name="detailedBio"
                    value={formData.detailedBio}
                    onChange={handleInputChange}
                    rows={5}
                    maxLength={2000}
                  />
                  <p className="text-[11px] text-[#916c82] -mt-2">{String(formData.detailedBio || '').length}/2000</p>
                </div>
              </SectionCard>
            </div>

            <SectionCard title="Locked Profile Content" subtitle="Curiosity-driven sections visible only after approval" icon="🔒">
              <div className="grid lg:grid-cols-2 gap-4 mb-4">
                <div className="relative rounded-2xl border border-rose-200 bg-white/80 p-4 overflow-hidden">
                  <p className="text-sm font-bold text-[#4c2a3c]">Private Prompts Preview</p>
                  <div className="mt-2 space-y-2 blur-[1.4px] opacity-80">
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs">Prompt question and answer preview</div>
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs">Only approved users can view full content</div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="rounded-full border border-rose-200 bg-white/90 px-3 py-1 text-xs font-bold text-rose-700">🔒 Only approved users can see this</span>
                  </div>
                </div>
                <div className="relative rounded-2xl border border-rose-200 bg-white/80 p-4 overflow-hidden">
                  <p className="text-sm font-bold text-[#4c2a3c]">Private Gallery Preview</p>
                  <div className="mt-2 grid grid-cols-3 gap-2 blur-[1.4px] opacity-80">
                    <div className="h-20 rounded-lg border border-rose-200 bg-gradient-to-br from-rose-100 to-fuchsia-100" />
                    <div className="h-20 rounded-lg border border-rose-200 bg-gradient-to-br from-rose-100 to-fuchsia-100" />
                    <div className="h-20 rounded-lg border border-rose-200 bg-gradient-to-br from-rose-100 to-fuchsia-100" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="rounded-full border border-rose-200 bg-white/90 px-3 py-1 text-xs font-bold text-rose-700">🔒 Only approved users can see this</span>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-[#4c2a3c]">Prompts</p>
                    <button type="button" onClick={addPrompt} className="px-3 py-1.5 rounded-full border border-rose-200 bg-white text-xs font-semibold text-rose-600 hover:-translate-y-0.5 transition">+ Add Prompt</button>
                  </div>
                  {(formData.prompts || []).length === 0 ? (
                    <p className="text-xs text-[#8a667d]">No prompts added yet.</p>
                  ) : (
                    <div className="space-y-3 max-h-[360px] overflow-auto pr-1">
                      {(formData.prompts || []).map((prompt, index) => (
                        <div key={`prompt-${index}`} className="rounded-xl border border-rose-200 bg-white p-3 shadow-sm">
                          <FloatingInput
                            label="Prompt Question"
                            value={prompt.question || ''}
                            onChange={(e) => handlePromptChange(index, 'question', e.target.value)}
                          />
                          <div className="mt-3" />
                          <FloatingTextarea
                            label="Prompt Answer"
                            value={prompt.answer || ''}
                            onChange={(e) => handlePromptChange(index, 'answer', e.target.value)}
                            rows={2}
                          />
                          <button type="button" onClick={() => removePrompt(index)} className="mt-2 text-xs font-semibold text-rose-600 hover:underline">Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-[#4c2a3c]">Gallery</p>
                    <button type="button" onClick={addGalleryItem} className="px-3 py-1.5 rounded-full border border-rose-200 bg-white text-xs font-semibold text-rose-600 hover:-translate-y-0.5 transition">+ Add Image</button>
                  </div>

                  {(formData.gallery || []).length === 0 ? (
                    <button type="button" onClick={addGalleryItem} className="w-full h-40 rounded-2xl border-2 border-dashed border-rose-300 bg-white/70 hover:bg-white transition flex flex-col items-center justify-center text-rose-600 font-semibold">
                      <span className="text-3xl">＋</span>
                      Add your first gallery image
                    </button>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3 max-h-[430px] overflow-auto pr-1">
                      {(formData.gallery || []).map((item, index) => (
                        <div key={`gallery-${index}`} className="rounded-2xl border border-rose-200 bg-white p-3 shadow-sm hover:-translate-y-0.5 transition">
                          <div className="rounded-xl overflow-hidden border border-rose-200 bg-rose-50 h-28 mb-2">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.caption || `Gallery ${index + 1}`} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">🖼</div>
                            )}
                          </div>
                          <FloatingInput
                            label="Image URL"
                            value={item.imageUrl || ''}
                            onChange={(e) => handleGalleryChange(index, 'imageUrl', e.target.value)}
                          />
                          <div className="mt-2" />
                          <FloatingTextarea
                            label="Caption"
                            value={item.caption || ''}
                            onChange={(e) => handleGalleryChange(index, 'caption', e.target.value)}
                            rows={2}
                          />
                          <div className="mt-2 flex items-center justify-between">
                            <input
                              type="number"
                              min="0"
                              value={item.order ?? index}
                              onChange={(e) => handleGalleryChange(index, 'order', e.target.value)}
                              className="w-20 rounded-lg border border-rose-200 px-2 py-1 text-xs text-[#4a2b3c] bg-white focus:outline-none focus:ring-2 focus:ring-rose-300"
                            />
                            <button type="button" onClick={() => removeGalleryItem(index)} className="text-xs font-semibold text-rose-600 hover:underline">Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Privacy Controls" subtitle="Fine-grained control with social-friendly switches" icon="🛡">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <ModernSwitch
                    icon="🟢"
                    title="Online Status"
                    subtitle="Show when you are active"
                    checked={formData.privacy.showOnlineStatus}
                    onChange={() => handlePrivacyToggle('showOnlineStatus')}
                  />
                  <ModernSwitch
                    icon="👁"
                    title="Allow Discovery"
                    subtitle="Appear in discover cards"
                    checked={formData.privacy.allowDiscovery}
                    onChange={() => handlePrivacyToggle('allowDiscovery')}
                  />
                  <ModernSwitch
                    icon="📨"
                    title="Allow Requests"
                    subtitle="Receive new connection/chat requests"
                    checked={formData.privacy.allowRequests}
                    onChange={() => handlePrivacyToggle('allowRequests')}
                  />
                  <ModernSwitch
                    icon="✅"
                    title="Show Verified Badge"
                    subtitle="Display trust badge publicly"
                    checked={formData.privacy.showVerifiedBadge}
                    onChange={() => handlePrivacyToggle('showVerifiedBadge')}
                  />

                  <div className="rounded-2xl border border-rose-200 bg-white p-4">
                    <p className="text-sm font-bold text-[#4c2a3c] mb-2">👁 Profile Visibility</p>
                    <select
                      value={formData.privacy.profileVisibility}
                      onChange={(e) => setFormData((prev) => ({ ...prev, privacy: { ...prev.privacy, profileVisibility: e.target.value } }))}
                      className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-[#43293a] focus:outline-none focus:ring-2 focus:ring-rose-300"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="connections_only">Connections only</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-2xl border border-rose-200 bg-white p-4">
                  <p className="text-sm font-bold text-[#4c2a3c] mb-3">🔒 Full Profile Rules</p>
                  <div className="space-y-2 text-sm text-[#5a3750]">
                    <label className="flex items-center justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50/50 px-3 py-2">
                      <span>Require separate approval</span>
                      <input type="checkbox" checked={formData.privacy.fullProfile.requireSeparateApproval} onChange={(e) => setFormData((prev) => ({ ...prev, privacy: { ...prev.privacy, fullProfile: { ...prev.privacy.fullProfile, requireSeparateApproval: e.target.checked } } }))} />
                    </label>
                    <label className="flex items-center justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50/50 px-3 py-2">
                      <span>Only chat-approved users</span>
                      <input type="checkbox" checked={formData.privacy.fullProfile.onlyConnectedUsers} onChange={(e) => setFormData((prev) => ({ ...prev, privacy: { ...prev.privacy, fullProfile: { ...prev.privacy.fullProfile, onlyConnectedUsers: e.target.checked } } }))} />
                    </label>
                    <label className="flex items-center justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50/50 px-3 py-2">
                      <span>Only verified requesters</span>
                      <input type="checkbox" checked={formData.privacy.fullProfile.onlyVerifiedRequesters} onChange={(e) => setFormData((prev) => ({ ...prev, privacy: { ...prev.privacy, fullProfile: { ...prev.privacy.fullProfile, onlyVerifiedRequesters: e.target.checked } } }))} />
                    </label>
                    <label className="flex items-center justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50/50 px-3 py-2">
                      <span>Same college only</span>
                      <input type="checkbox" checked={formData.privacy.fullProfile.sameCollegeOnly} onChange={(e) => setFormData((prev) => ({ ...prev, privacy: { ...prev.privacy, fullProfile: { ...prev.privacy.fullProfile, sameCollegeOnly: e.target.checked } } }))} />
                    </label>
                    <label className="flex items-center justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50/50 px-3 py-2">
                      <span>Auto-decline unknown users</span>
                      <input type="checkbox" checked={formData.privacy.fullProfile.autoDeclineUnknownUsers} onChange={(e) => setFormData((prev) => ({ ...prev, privacy: { ...prev.privacy, fullProfile: { ...prev.privacy.fullProfile, autoDeclineUnknownUsers: e.target.checked } } }))} />
                    </label>
                    <div className="rounded-xl border border-rose-100 bg-rose-50/50 px-3 py-2 flex items-center justify-between">
                      <span>Cooldown (hours)</span>
                      <input type="number" min="1" max="720" value={formData.privacy.fullProfile.requestCooldownHours} onChange={(e) => setFormData((prev) => ({ ...prev, privacy: { ...prev.privacy, fullProfile: { ...prev.privacy.fullProfile, requestCooldownHours: Number(e.target.value || 72) } } }))} className="w-20 rounded-lg border border-rose-200 px-2 py-1 text-xs text-[#4a2b3c] bg-white" />
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Request Management" subtitle="Your private-profile access dashboard" icon="📬">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-rose-200 bg-white p-4">
                  <p className="font-bold text-[#4c2a3c] mb-2">Incoming Requests</p>
                  {privacyLoading ? <p className="text-xs text-[#8a667d]">Loading...</p> : null}
                  {!privacyLoading && incomingProfileRequests.length === 0 ? <p className="text-xs text-[#8a667d]">No pending incoming requests</p> : null}
                  <div className="space-y-2 mt-2">
                    {incomingProfileRequests.map((item) => (
                      <RequestMiniCard
                        key={item._id}
                        user={item?.requesterId}
                        subtitle="Wants full profile access"
                        actions={(
                          <div className="mt-2 flex gap-1.5">
                            <button type="button" onClick={() => handleProfileRequestAction(item._id, 'approve')} className="px-2 py-1 rounded-full text-[11px] bg-emerald-100 text-emerald-700 font-semibold">Approve</button>
                            <button type="button" onClick={() => handleProfileRequestAction(item._id, 'decline')} className="px-2 py-1 rounded-full text-[11px] bg-rose-100 text-rose-700 font-semibold">Decline</button>
                          </div>
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-rose-200 bg-white p-4">
                  <p className="font-bold text-[#4c2a3c] mb-2">Outgoing Requests</p>
                  {privacyLoading ? <p className="text-xs text-[#8a667d]">Loading...</p> : null}
                  {!privacyLoading && outgoingProfileRequests.length === 0 ? <p className="text-xs text-[#8a667d]">No outgoing requests yet</p> : null}
                  <div className="space-y-2 mt-2">
                    {outgoingProfileRequests.slice(0, 8).map((item) => (
                      <RequestMiniCard
                        key={item._id}
                        user={item?.profileOwnerId}
                        subtitle={`Status: ${item.status}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-rose-200 bg-white p-4">
                  <p className="font-bold text-[#4c2a3c] mb-2">Approved Viewers</p>
                  {privacyLoading ? <p className="text-xs text-[#8a667d]">Loading...</p> : null}
                  {!privacyLoading && approvedViewers.length === 0 ? <p className="text-xs text-[#8a667d]">No approved viewers right now</p> : null}
                  <div className="space-y-2 mt-2">
                    {approvedViewers.map((item) => (
                      <RequestMiniCard
                        key={item._id}
                        user={item?.viewerId}
                        subtitle="Has access"
                        actions={(
                          <button type="button" onClick={() => handleRevokeViewer(item?.viewerId?._id)} className="mt-2 px-2 py-1 rounded-full text-[11px] bg-rose-100 text-rose-700 font-semibold">Revoke Access</button>
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Interests" subtitle="Tap to curate your vibe" icon="🎯">
              <div className="flex flex-wrap gap-2.5">
                {['Tech', 'Music', 'Travel', 'Gaming', 'Art', 'Sports', 'Movies', 'Cooking', 'Fitness', 'Reading'].map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95 ${
                      formData.interests.includes(interest)
                        ? 'bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white shadow-[0_0_16px_rgba(244,114,182,0.38)] hover:-translate-y-0.5'
                        : 'bg-white text-[#613c53] border border-rose-200 hover:bg-rose-50 hover:-translate-y-0.5'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </SectionCard>

            <div className="grid md:grid-cols-2 gap-4 pt-1">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-6 py-4 rounded-2xl text-white text-base font-bold bg-gradient-to-r from-rose-500 to-fuchsia-500 shadow-[0_0_26px_rgba(244,114,182,0.45)] hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[0.99] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? '💾 Saving...' : '💾 Save Changes'}
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-4 rounded-2xl border-2 border-rose-300 text-rose-600 text-base font-bold bg-white/80 hover:bg-rose-50 hover:-translate-y-0.5 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LockedOverlay() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/45 to-white/70 backdrop-blur-[2.5px] flex items-center justify-center pointer-events-none">
      <div className="text-center px-4">
        <p className="text-xl mb-1">🔒</p>
        <p className="text-xs font-semibold text-rose-700">This part of the profile is private</p>
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, icon, children }) {
  return (
    <section className="rounded-3xl border border-rose-200/75 bg-white/92 p-5 md:p-6 shadow-[0_16px_42px_rgba(190,24,93,0.1)] animate-fade-in-up">
      <div className="mb-4">
        <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-rose-500">{icon} {title}</p>
        <h2 className="text-2xl font-black tracking-tight text-[#3e1f35] mt-1">{title}</h2>
        <p className="text-sm text-[#866177] mt-1">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function FloatingInput({ label, name, value, onChange, type = 'text', disabled = false, ...rest }) {
  return (
    <label className="relative block group">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder=" "
        className={`peer w-full rounded-2xl border px-4 pt-6 pb-2.5 text-[#41293a] bg-white transition outline-none ${
          disabled
            ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
            : 'border-rose-200 focus:border-rose-300 focus:ring-4 focus:ring-rose-100'
        }`}
        {...rest}
      />
      <span className="absolute left-4 top-2 text-[11px] uppercase tracking-[0.14em] font-semibold text-rose-500 transition peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-[#8f6e82] peer-focus:top-2 peer-focus:text-[11px] peer-focus:uppercase peer-focus:tracking-[0.14em] peer-focus:text-rose-500">
        {label}
      </span>
    </label>
  );
}

function FloatingTextarea({ label, name, value, onChange, rows = 3, ...rest }) {
  return (
    <label className="relative block group">
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder=" "
        className="peer w-full rounded-2xl border border-rose-200 px-4 pt-6 pb-2.5 text-[#41293a] bg-white transition outline-none resize-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
        {...rest}
      />
      <span className="absolute left-4 top-2 text-[11px] uppercase tracking-[0.14em] font-semibold text-rose-500 transition peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-[#8f6e82] peer-focus:top-2 peer-focus:text-[11px] peer-focus:uppercase peer-focus:tracking-[0.14em] peer-focus:text-rose-500">
        {label}
      </span>
    </label>
  );
}

function ModernSwitch({ icon, title, subtitle, checked, onChange }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-white px-4 py-3 flex items-center justify-between gap-3 hover:shadow-sm transition">
      <div>
        <p className="text-sm font-bold text-[#4c2a3c]">{icon} {title}</p>
        <p className="text-xs text-[#8a667d] mt-0.5">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative w-14 h-8 rounded-full transition ${checked ? 'bg-emerald-400' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${checked ? 'left-7' : 'left-1'}`} />
      </button>
    </div>
  );
}

function RequestMiniCard({ user, subtitle, actions = null }) {
  const visual = resolvePublicProfileVisual(user || {});

  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-2.5 hover:-translate-y-0.5 hover:shadow-sm transition">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full overflow-hidden border border-rose-200 bg-white flex items-center justify-center text-lg">
          {visual.type === 'photo' ? (
            <img src={visual.value} alt={user?.name || 'User'} className="w-full h-full object-cover" />
          ) : (
            <span>{visual.value}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#4c2a3c] truncate">{user?.name || 'User'}</p>
          <p className="text-[11px] text-[#8a667d] truncate">{subtitle}</p>
        </div>
      </div>
      {actions}
    </div>
  );
}
