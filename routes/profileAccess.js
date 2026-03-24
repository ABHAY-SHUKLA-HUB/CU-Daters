import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Connection from '../models/Connection.js';
import FullProfileAccess from '../models/FullProfileAccess.js';
import ProfileViewRequest from '../models/ProfileViewRequest.js';
import { verifyFirebaseOrJwtAuth } from '../middleware/authFirebaseOrJwt.js';
import { asyncHandler, AppError } from '../utils/errorHandler.js';

const router = express.Router();

const normalizePair = (a, b) => [a.toString(), b.toString()].sort();
const pairKeyOf = (a, b) => normalizePair(a, b).join(':');

const ensureObjectId = (value, label = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new AppError(`Invalid ${label}`, 400);
  }
};

const getPublicPreview = (user) => {
  const shortAbout = String(user?.shortAbout || user?.bio || '').trim();
  return {
    userId: user?._id,
    displayPhoto: user?.profilePhoto || user?.livePhoto || null,
    displayName: user?.name || 'User',
    age: user?.age || null,
    shortAbout: shortAbout ? shortAbout.slice(0, 160) : '',
    verifiedBadge: Boolean(
      user?.verified_badge ||
      user?.is_verified ||
      user?.college_verification_status === 'verified'
    ),
    basicInfo: {
      college: user?.college || '',
      course: user?.course || '',
      year: user?.year || ''
    }
  };
};

const getFullProfilePayload = (user) => {
  const gallery = (Array.isArray(user?.gallery) ? user.gallery : [])
    .map((item, idx) => ({
      id: String(item?._id || idx),
      imageUrl: item?.imageUrl || '',
      caption: item?.caption || '',
      order: Number(item?.order || idx)
    }))
    .filter((item) => item.imageUrl)
    .sort((a, b) => a.order - b.order);

  return {
    detailedBio: user?.detailedBio || user?.bio || '',
    interests: Array.isArray(user?.interests) ? user.interests : [],
    prompts: Array.isArray(user?.prompts) ? user.prompts : [],
    gallery,
    expanded: {
      lifestyle: user?.lifestyle || null,
      personality: user?.personality || null
    }
  };
};

const isConnected = async (a, b) => {
  const pairKey = pairKeyOf(a, b);
  const row = await Connection.findOne({ pairKey }).select('_id').lean();
  return Boolean(row);
};

const getAccessRow = async (ownerId, viewerId) => {
  const pairKey = pairKeyOf(ownerId, viewerId);
  const row = await FullProfileAccess.findOne({ pairKey }).lean();
  return row || null;
};

const canViewFullProfile = async (ownerId, viewerId) => {
  if (ownerId.toString() === viewerId.toString()) {
    return true;
  }
  const access = await getAccessRow(ownerId, viewerId);
  return access?.status === 'approved';
};

router.use(verifyFirebaseOrJwtAuth);

const getProfileViewHandler = asyncHandler(async (req, res) => {
  const viewerId = req.userId.toString();
  const { profileOwnerId } = req.params;

  ensureObjectId(profileOwnerId, 'profileOwnerId');

  const owner = await User.findById(profileOwnerId)
    .select('_id name age shortAbout bio detailedBio interests prompts gallery profilePhoto livePhoto verified_badge is_verified college_verification_status college course year privacy status role')
    .lean();

  if (!owner || owner.role !== 'user' || owner.status !== 'active') {
    throw new AppError('Profile not available', 404);
  }

  const fullAccess = await canViewFullProfile(profileOwnerId, viewerId);
  const accessRow = viewerId === profileOwnerId ? null : await getAccessRow(profileOwnerId, viewerId);

  let myRequest = null;
  if (viewerId !== profileOwnerId) {
    myRequest = await ProfileViewRequest.findOne({
      requesterId: viewerId,
      profileOwnerId,
      status: { $in: ['pending', 'approved', 'declined'] }
    })
      .sort({ createdAt: -1 })
      .lean();
  }

  return res.json({
    success: true,
    data: {
      preview: getPublicPreview(owner),
      fullProfile: fullAccess ? getFullProfilePayload(owner) : null,
      access: {
        chatAvailable: viewerId === profileOwnerId ? true : await isConnected(viewerId, profileOwnerId),
        fullProfileAccess: fullAccess,
        fullProfileStatus: fullAccess ? 'approved' : (accessRow?.status || 'locked'),
        requiresApproval: owner?.privacy?.fullProfile?.requireSeparateApproval !== false,
        myRequest: myRequest
          ? {
              id: myRequest._id,
              status: myRequest.status,
              createdAt: myRequest.createdAt,
              updatedAt: myRequest.updatedAt
            }
          : null
      },
      lockedPreview: fullAccess
        ? null
        : {
            gallerySlots: Math.max(3, (owner.gallery || []).length || 3),
            label: 'Full profile is private. Request access to view all photos, interests and deeper profile sections.'
          }
    }
  });
    });

    router.get('/profiles/:profileOwnerId', getProfileViewHandler);
    router.get('/profile/:profileOwnerId', getProfileViewHandler);

router.post('/requests', asyncHandler(async (req, res) => {
  const requesterId = req.userId.toString();
  const profileOwnerId = String(req.body?.profileOwnerId || '');
  const requestedMessage = String(req.body?.message || '').trim().slice(0, 220);

  ensureObjectId(profileOwnerId, 'profileOwnerId');

  if (requesterId === profileOwnerId) {
    throw new AppError('Cannot request your own profile', 400);
  }

  const [requester, owner] = await Promise.all([
    User.findById(requesterId)
      .select('_id status role college verified_badge is_verified college_verification_status')
      .lean(),
    User.findById(profileOwnerId)
      .select('_id status role college privacy')
      .lean()
  ]);

  if (!requester || requester.role !== 'user' || requester.status !== 'active') {
    throw new AppError('Requester not eligible', 403);
  }

  if (!owner || owner.role !== 'user' || owner.status !== 'active') {
    throw new AppError('Profile owner not available', 404);
  }

  const settings = {
    requireSeparateApproval: owner?.privacy?.fullProfile?.requireSeparateApproval !== false,
    requestCooldownHours: Number(owner?.privacy?.fullProfile?.requestCooldownHours || 72),
    onlyVerifiedRequesters: Boolean(owner?.privacy?.fullProfile?.onlyVerifiedRequesters),
    onlyConnectedUsers: owner?.privacy?.fullProfile?.onlyConnectedUsers !== false,
    sameCollegeOnly: Boolean(owner?.privacy?.fullProfile?.sameCollegeOnly),
    autoDeclineUnknownUsers: Boolean(owner?.privacy?.fullProfile?.autoDeclineUnknownUsers)
  };

  if (!settings.requireSeparateApproval) {
    throw new AppError('Profile owner does not require requests for full profile right now', 409);
  }

  const alreadyApproved = await canViewFullProfile(profileOwnerId, requesterId);
  if (alreadyApproved) {
    throw new AppError('Full profile access already approved', 409);
  }

  const connected = await isConnected(profileOwnerId, requesterId);

  if (settings.onlyConnectedUsers && !connected) {
    throw new AppError('Only chat-approved users can request full profile access', 403);
  }

  if (settings.sameCollegeOnly) {
    const ownerCollege = String(owner?.college || '').trim().toLowerCase();
    const requesterCollege = String(requester?.college || '').trim().toLowerCase();
    if (!ownerCollege || !requesterCollege || ownerCollege !== requesterCollege) {
      throw new AppError('Full profile requests are restricted to same-college users', 403);
    }
  }

  if (settings.onlyVerifiedRequesters) {
    const verified = Boolean(
      requester?.verified_badge ||
      requester?.is_verified ||
      requester?.college_verification_status === 'verified'
    );
    if (!verified) {
      throw new AppError('Only verified users can request this full profile', 403);
    }
  }

  if (settings.autoDeclineUnknownUsers && !connected) {
    throw new AppError('This profile auto-declines unknown users', 403);
  }

  const existingPending = await ProfileViewRequest.findOne({
    requesterId,
    profileOwnerId,
    status: 'pending'
  }).lean();

  if (existingPending) {
    throw new AppError('A profile view request is already pending', 409);
  }

  const latestDeclined = await ProfileViewRequest.findOne({
    requesterId,
    profileOwnerId,
    status: 'declined'
  })
    .sort({ updatedAt: -1 })
    .lean();

  if (latestDeclined) {
    const cooldownMs = Math.max(1, settings.requestCooldownHours) * 60 * 60 * 1000;
    const elapsed = Date.now() - new Date(latestDeclined.updatedAt).getTime();
    if (elapsed < cooldownMs) {
      const remainingHours = Math.ceil((cooldownMs - elapsed) / (60 * 60 * 1000));
      throw new AppError(`You can request again in ${remainingHours} hour(s)`, 429);
    }
  }

  const request = await ProfileViewRequest.create({
    requesterId,
    profileOwnerId,
    pairKey: pairKeyOf(requesterId, profileOwnerId),
    status: 'pending',
    requestedMessage
  });

  return res.status(201).json({
    success: true,
    message: 'Full profile request sent',
    data: { request }
  });
}));

router.post('/requests/:requestId/cancel', asyncHandler(async (req, res) => {
  const requesterId = req.userId.toString();
  const { requestId } = req.params;

  ensureObjectId(requestId, 'requestId');

  const request = await ProfileViewRequest.findById(requestId);
  if (!request) {
    throw new AppError('Request not found', 404);
  }

  if (request.requesterId.toString() !== requesterId) {
    throw new AppError('Not allowed to cancel this request', 403);
  }

  if (request.status !== 'pending') {
    throw new AppError('Only pending requests can be cancelled', 400);
  }

  request.status = 'cancelled';
  request.actedBy = requesterId;
  request.actedAt = new Date();
  await request.save();

  return res.json({ success: true, message: 'Request cancelled', data: { request } });
}));

router.post('/requests/:requestId/approve', asyncHandler(async (req, res) => {
  const ownerId = req.userId.toString();
  const { requestId } = req.params;

  ensureObjectId(requestId, 'requestId');

  const request = await ProfileViewRequest.findById(requestId);
  if (!request) {
    throw new AppError('Request not found', 404);
  }

  if (request.profileOwnerId.toString() !== ownerId) {
    throw new AppError('Not allowed to approve this request', 403);
  }

  if (request.status !== 'pending') {
    throw new AppError(`Request already ${request.status}`, 400);
  }

  request.status = 'approved';
  request.actedBy = ownerId;
  request.actedAt = new Date();
  request.responseMessage = String(req.body?.message || '').trim().slice(0, 220);
  await request.save();

  const pairKey = pairKeyOf(request.profileOwnerId, request.requesterId);
  await FullProfileAccess.findOneAndUpdate(
    { pairKey },
    {
      $set: {
        profileOwnerId: request.profileOwnerId,
        viewerId: request.requesterId,
        pairKey,
        status: 'approved',
        approvedAt: new Date(),
        revokedAt: null,
        revokedBy: null
      }
    },
    { upsert: true, new: true }
  );

  return res.json({ success: true, message: 'Full profile access approved', data: { request } });
}));

router.post('/requests/:requestId/decline', asyncHandler(async (req, res) => {
  const ownerId = req.userId.toString();
  const { requestId } = req.params;

  ensureObjectId(requestId, 'requestId');

  const request = await ProfileViewRequest.findById(requestId);
  if (!request) {
    throw new AppError('Request not found', 404);
  }

  if (request.profileOwnerId.toString() !== ownerId) {
    throw new AppError('Not allowed to decline this request', 403);
  }

  if (request.status !== 'pending') {
    throw new AppError(`Request already ${request.status}`, 400);
  }

  request.status = 'declined';
  request.actedBy = ownerId;
  request.actedAt = new Date();
  request.responseMessage = String(req.body?.message || '').trim().slice(0, 220);
  await request.save();

  return res.json({ success: true, message: 'Request declined', data: { request } });
}));

router.post('/viewers/:viewerId/revoke', asyncHandler(async (req, res) => {
  const ownerId = req.userId.toString();
  const { viewerId } = req.params;

  ensureObjectId(viewerId, 'viewerId');

  if (ownerId === viewerId.toString()) {
    throw new AppError('Invalid revoke target', 400);
  }

  const pairKey = pairKeyOf(ownerId, viewerId);
  const access = await FullProfileAccess.findOne({ pairKey });
  if (!access || access.status !== 'approved') {
    throw new AppError('No approved access found', 404);
  }

  access.status = 'revoked';
  access.revokedAt = new Date();
  access.revokedBy = ownerId;
  await access.save();

  return res.json({ success: true, message: 'Full profile access revoked', data: { access } });
}));

router.get('/requests/incoming', asyncHandler(async (req, res) => {
  const ownerId = req.userId.toString();

  const requests = await ProfileViewRequest.find({ profileOwnerId: ownerId, status: 'pending' })
    .populate('requesterId', '_id name age shortAbout bio profilePhoto verified_badge is_verified college_verification_status')
    .sort({ createdAt: -1 })
    .lean();

  return res.json({ success: true, data: { requests } });
}));

router.get('/requests/outgoing', asyncHandler(async (req, res) => {
  const requesterId = req.userId.toString();

  const requests = await ProfileViewRequest.find({
    requesterId,
    status: { $in: ['pending', 'approved', 'declined', 'cancelled'] }
  })
    .populate('profileOwnerId', '_id name age shortAbout bio profilePhoto verified_badge is_verified college_verification_status')
    .sort({ createdAt: -1 })
    .lean();

  return res.json({ success: true, data: { requests } });
}));

router.get('/viewers', asyncHandler(async (req, res) => {
  const ownerId = req.userId.toString();

  const viewers = await FullProfileAccess.find({ profileOwnerId: ownerId, status: 'approved' })
    .populate('viewerId', '_id name age profilePhoto shortAbout bio verified_badge is_verified college_verification_status')
    .sort({ updatedAt: -1 })
    .lean();

  return res.json({ success: true, data: { viewers } });
}));

router.patch('/settings', asyncHandler(async (req, res) => {
  const ownerId = req.userId.toString();
  const settings = req.body?.settings || {};

  const user = await User.findById(ownerId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const current = user?.privacy?.fullProfile || {};
  const next = {
    ...current,
    ...(settings.requireSeparateApproval !== undefined ? { requireSeparateApproval: Boolean(settings.requireSeparateApproval) } : {}),
    ...(settings.requestCooldownHours !== undefined ? { requestCooldownHours: Math.max(1, Math.min(720, Number(settings.requestCooldownHours) || 72)) } : {}),
    ...(settings.onlyVerifiedRequesters !== undefined ? { onlyVerifiedRequesters: Boolean(settings.onlyVerifiedRequesters) } : {}),
    ...(settings.onlyConnectedUsers !== undefined ? { onlyConnectedUsers: Boolean(settings.onlyConnectedUsers) } : {}),
    ...(settings.sameCollegeOnly !== undefined ? { sameCollegeOnly: Boolean(settings.sameCollegeOnly) } : {}),
    ...(settings.autoDeclineUnknownUsers !== undefined ? { autoDeclineUnknownUsers: Boolean(settings.autoDeclineUnknownUsers) } : {})
  };

  user.privacy = {
    ...(user.privacy?.toObject?.() || user.privacy || {}),
    fullProfile: next
  };

  await user.save();

  return res.json({ success: true, message: 'Full profile privacy settings updated', data: { settings: user.privacy.fullProfile } });
}));

export default router;
