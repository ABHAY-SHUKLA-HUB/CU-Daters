export const AVATAR_PRESETS = [
  { id: 'male_default', label: 'Male Default', emoji: '👨' },
  { id: 'female_default', label: 'Female Default', emoji: '👩' },
  { id: 'cool', label: 'Cool', emoji: '😎' },
  { id: 'student', label: 'Student', emoji: '🧑‍🎓' },
  { id: 'creative', label: 'Creative', emoji: '🧑‍🎨' },
  { id: 'classic', label: 'Classic', emoji: '🙂' }
];

export function getDefaultAvatarByGender(gender) {
  if (gender === 'female') return '👩';
  if (gender === 'male') return '👨';
  return '🧑';
}

export function getAvatarEmoji(profile = {}) {
  const preset = profile?.avatarConfig?.preset;
  if (preset) {
    const selected = AVATAR_PRESETS.find((item) => item.id === preset);
    if (selected) return selected.emoji;
  }
  return getDefaultAvatarByGender(profile?.gender);
}

export function resolvePublicProfileVisual(profile = {}) {
  if (profile?.profilePhoto) {
    return { type: 'photo', value: profile.profilePhoto };
  }
  return { type: 'avatar', value: getAvatarEmoji(profile) };
}

function collectStringMedia(values = []) {
  return values
    .flatMap((item) => {
      if (!item) return [];
      if (typeof item === 'string') return [item];
      if (typeof item === 'object') {
        return [
          item.url,
          item.src,
          item.value,
          item.photo,
          item.image,
          item.secure_url
        ].filter(Boolean);
      }
      return [];
    })
    .filter((item) => typeof item === 'string' && item.trim().length > 0);
}

export function resolveProfileGallery(profile = {}) {
  const directSources = [
    profile?.profilePhoto,
    profile?.livePhoto,
    profile?.avatar,
    ...(Array.isArray(profile?.photos) ? profile.photos : []),
    ...(Array.isArray(profile?.gallery) ? profile.gallery : []),
    ...(Array.isArray(profile?.images) ? profile.images : []),
    ...(Array.isArray(profile?.media) ? profile.media : [])
  ];

  const resolved = collectStringMedia(directSources)
    .filter((item) => /^https?:\/\//i.test(item) || item.startsWith('data:image/') || item.startsWith('/uploads/'));

  const unique = [...new Set(resolved)];

  if (unique.length > 0) {
    return unique;
  }

  if (profile?.profilePhoto && typeof profile.profilePhoto === 'string') {
    return [profile.profilePhoto];
  }

  return [];
}
