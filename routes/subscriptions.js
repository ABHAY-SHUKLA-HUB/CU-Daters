import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import AppSetting from '../models/AppSetting.js';
import { verifyAuth, logActivity, getClientInfo } from '../utils/auth.js';
import {
  checkDuplicatePayment,
  errorResponse,
  successResponse
} from '../utils/validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router();

// ===== MULTER SETUP =====
const uploadDir = path.join(dirname(__dirname), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✓ Created uploads directory');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG and PNG files allowed'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// ===== PUBLIC PRICING CONFIG (FALLBACK) =====
// Used by frontend when /api/config/pricing is not available on older deployments.
router.get('/pricing-config', async (req, res) => {
  try {
    const setting = await AppSetting.findOne({ key: 'billing_config' }).lean();
    const billing = setting?.value || {};

    const premiumPrice = Number(billing.premiumPrice || billing.monthlyPrice) || 99;
    const maxMessagesPerDay = Number(billing.maxMessagesPerDay) || 50;
    const maxActiveMatches = Number(billing.maxActiveMatches) || 1;
    const maxRequestsPerDay = Number(billing.maxRequestsPerDay) || 5;
    const premiumFree = Boolean(billing.premiumFree);
    const disableFreeMode = Boolean(billing.disableFreeMode);
    const bankEnabled = billing.bankEnabled !== false;
    const accountHolder = String(billing.accountHolder || 'CU Daters Pvt Ltd');
    const bankName = String(billing.bankName || 'HDFC Bank');
    const accountNumber = String(billing.accountNumber || '1234567890123456');
    const ifscCode = String(billing.ifscCode || 'HDFC0005678');
    const paymentInstructions = String(billing.paymentInstructions || 'Use your payment ID/UTR in submission for faster approval.');

    return res.json(successResponse('Pricing configuration fetched', {
      plans: {
        free: {
          id: 'free',
          name: 'Free',
          price: 0,
          currency: '₹',
          period: '/month',
          description: 'Perfect to get started',
          enabled: !disableFreeMode,
          buttonText: 'Continue Free'
        },
        premium: {
          id: 'premium',
          name: 'Premium',
          price: premiumPrice,
          currency: '₹',
          period: '/month',
          description: 'Unlock everything',
          enabled: true,
          tag: 'Most Popular',
          buttonText: 'Upgrade Now'
        }
      },
      features: {
        messaging: {
          name: 'Messaging',
          free: {
            enabled: true,
            maxMessagesPerDay,
            maxActiveMatches,
            label: `${maxMessagesPerDay} messages/day - ${maxActiveMatches} active match`
          },
          premium: {
            enabled: true,
            maxMessagesPerDay: Number.MAX_SAFE_INTEGER,
            maxActiveMatches: Number.MAX_SAFE_INTEGER,
            label: 'Unlimited messages - Unlimited matches'
          }
        },
        profileView: {
          name: 'Profile Visibility',
          free: { enabled: true, canViewFullProfile: false, canViewFullGallery: false, label: 'Basic profile view' },
          premium: { enabled: true, canViewFullProfile: true, canViewFullGallery: true, label: 'Full profiles + galleries' }
        },
        discovery: {
          name: 'Discovery Features',
          free: { enabled: true, canSeeWhoLiked: false, canUseAdvancedFilters: false, label: 'Basic discover' },
          premium: { enabled: true, canSeeWhoLiked: true, canUseAdvancedFilters: true, label: 'See who liked + Advanced filters' }
        },
        requests: {
          name: 'Connection Requests',
          free: { enabled: true, maxRequestsPerDay, label: `Send ${maxRequestsPerDay} requests/day` },
          premium: { enabled: true, maxRequestsPerDay: Number.MAX_SAFE_INTEGER, label: 'Unlimited requests' }
        },
        incognito: {
          name: 'Incognito Mode',
          free: { enabled: false, label: 'Locked' },
          premium: { enabled: true, label: 'Browse invisibly' }
        },
        messageBeforeMatch: {
          name: 'Message Before Match',
          free: { enabled: false, label: 'Locked' },
          premium: { enabled: true, label: 'Send first message' }
        },
        boosts: {
          name: 'Profile Boosts',
          free: { enabled: false, boostsPerMonth: 0, label: 'Locked' },
          premium: { enabled: true, boostsPerMonth: 3, label: '3 boosts/month' }
        },
        noAds: {
          name: 'Ad-Free',
          free: { enabled: false, label: 'See ads' },
          premium: { enabled: true, label: 'Ad-free experience' }
        }
      },
      payment: {
        enabled: Boolean(billing.upiEnabled || billing.qrEnabled || bankEnabled),
        methods: {
          upi: {
            enabled: billing.upiEnabled !== false,
            id: billing.upiId || '',
            name: 'Admin UPI'
          },
          qr: {
            enabled: billing.qrEnabled !== false
          },
          bank: {
            enabled: bankEnabled,
            accountHolder,
            bankName,
            accountNumber,
            ifscCode
          }
        },
        offerBanner: {
          enabled: Boolean(billing.offerText),
          text: billing.offerText || ''
        },
        paymentInstructions
      },
      globalOverride: {
        premiumFree,
        disableFreeMode
      },
      featureLocks: {},
      coupons: []
    }));
  } catch (error) {
    console.error('❌ Pricing Config Fetch Error:', error);
    return res.status(500).json(errorResponse('Failed to fetch pricing configuration'));
  }
});

// ===== SUBMIT SUBSCRIPTION =====
router.post('/request', verifyAuth, upload.single('screenshot'), async (req, res) => {
  console.log('\n========== SUBSCRIPTION REQUEST ==========');
  
  try {
    const userId = req.user._id;
    const { plan, senderName } = req.body;

    if (!plan || !senderName) {
      return res.status(400).json(errorResponse('Plan and sender name are required'));
    }

    if (!req.file) {
      return res.status(400).json(errorResponse('Screenshot is required'));
    }

    // Parse payment details
    const paymentId = req.body.paymentId || req.body.utr || `PAY-${Date.now()}`;

    // Resolve billing config from DB and enforce server-side amount.
    const billingSetting = await AppSetting.findOne({ key: 'billing_config' }).lean();
    const billing = typeof billingSetting?.value === 'string'
      ? (() => {
          try {
            return JSON.parse(billingSetting.value);
          } catch {
            return {};
          }
        })()
      : (billingSetting?.value || {});

    const paymentEnabled = Boolean((billing.upiEnabled ?? true) || (billing.qrEnabled ?? true) || (billing.bankEnabled ?? true));
    if (!paymentEnabled) {
      return res.status(503).json(errorResponse('Payments are temporarily disabled by admin. Please try again later.'));
    }

    const normalizedPlan = String(plan || '').trim().toLowerCase();
    const isPremiumPlan = normalizedPlan.includes('premium') || normalizedPlan.includes('crush+') || normalizedPlan.includes('paid');
    const premiumPrice = Number(billing.premiumPrice || billing.monthlyPrice) || 99;
    const requestedAmount = Number(req.body.amount);
    const amount = isPremiumPlan
      ? premiumPrice
      : (Number.isFinite(requestedAmount) && requestedAmount > 0 ? requestedAmount : premiumPrice);

    // Check duplicate payment ID
    const isDuplicatePayment = await checkDuplicatePayment(Subscription, paymentId);
    if (isDuplicatePayment) {
      return res.status(409).json(errorResponse('This payment ID has already been used'));
    }

    const screenshotFile = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`;

    // Create subscription
    const subscription = new Subscription({
      user_id: userId,
      plan,
      amount,
      payment_id: paymentId,
      screenshot_url: screenshotFile,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    });

    await subscription.save();
    console.log(`✓ Subscription created: ${subscription._id}`);

    // Update user subscription status
    await User.findByIdAndUpdate(userId, {
      subscription_status: 'pending',
      subscription_plan: plan,
      updated_at: new Date()
    });

    // Log activity
    await logActivity({
      user_id: userId,
      action: 'payment_submit',
      description: `User submitted payment for ${plan} plan (${paymentId})`,
      target_type: 'subscription',
      target_id: subscription._id,
      ...getClientInfo(req),
      status: 'success'
    });

    res.status(201).json(
      successResponse('Payment submitted successfully', {
        submission_id: subscription._id,
        status: 'pending'
      })
    );
  } catch (error) {
    console.error('❌ Subscription Request Error:', error);
    res.status(500).json(errorResponse('Failed to submit payment: ' + error.message));
  }
});

// ===== GET USER SUBSCRIPTIONS =====
router.get('/user/:userId', verifyAuth, async (req, res) => {
  try {
    const userId = req.params.userId;

    const subscriptions = await Subscription.find({ user_id: userId })
      .sort({ created_at: -1 });

    res.json(successResponse('User subscriptions fetched', subscriptions));
  } catch (error) {
    console.error('❌ Get User Subscriptions Error:', error);
    res.status(500).json(errorResponse('Failed to fetch subscriptions: ' + error.message));
  }
});

// ===== GET SINGLE SUBSCRIPTION =====
router.get('/:subscriptionId', verifyAuth, async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.subscriptionId)
      .populate('user_id', 'name email phone')
      .populate('approved_by', 'name email')
      .populate('rejected_by', 'name email');

    if (!subscription) {
      return res.status(404).json(errorResponse('Subscription not found'));
    }

    res.json(successResponse('Subscription fetched', subscription));
  } catch (error) {
    console.error('❌ Get Subscription Error:', error);
    res.status(500).json(errorResponse('Failed to fetch subscription: ' + error.message));
  }
});

export default router;
