/**
 * CONFIG ROUTES - Serve dynamic pricing & feature configuration
 * 
 * Endpoints:
 * GET /api/config/pricing - Get all pricing plans and features
 * GET /api/config/features - Get feature flags for current user
 */

import express from 'express';
import pricingConfig from '../config/pricingConfig.js';
import { verifyFirebaseOrJwtAuth } from '../middleware/authFirebaseOrJwt.js';
import { asyncHandler, AppError } from '../utils/errorHandler.js';
import User from '../models/User.js';
import AppSetting from '../models/AppSetting.js';

const router = express.Router();

/**
 * GET /api/config/pricing
 * 
 * Returns:
 * - All pricing plans (Free, Premium)
 * - Features for each plan
 * - Payment configuration
 * - Global overrides
 * 
 * PUBLIC - No auth required
 */
router.get('/pricing', asyncHandler(async (req, res) => {
  const { plans, features, payment, globalOverride, featureLocks, coupons } = pricingConfig;
  const setting = await AppSetting.findOne({ key: 'billing_config' }).lean();
  const rawValue = setting?.value;
  let billing = {};

  if (typeof rawValue === 'string') {
    try {
      billing = JSON.parse(rawValue);
    } catch {
      billing = {};
    }
  } else if (rawValue && typeof rawValue === 'object') {
    billing = rawValue;
  }

  const premiumPrice = Number(billing.premiumPrice || billing.monthlyPrice || plans.premium?.price || 99);
  const freeEnabled = !(billing.disableFreeMode ?? globalOverride.disableFreeMode);
  const premiumFree = billing.premiumFree ?? globalOverride.premiumFree;
  const maxMessagesPerDay = Math.max(1, Number(billing.maxMessagesPerDay || features.messaging?.free?.maxMessagesPerDay || 50));
  const maxActiveMatches = Math.max(1, Number(billing.maxActiveMatches || features.messaging?.free?.maxActiveMatches || 1));
  const maxRequestsPerDay = Math.max(1, Number(billing.maxRequestsPerDay || features.requests?.free?.maxRequestsPerDay || 5));

  const effectivePlans = {
    ...plans,
    free: {
      ...plans.free,
      enabled: freeEnabled
    },
    premium: {
      ...plans.premium,
      price: premiumPrice
    }
  };

  const effectiveFeatures = {
    ...features,
    messaging: {
      ...features.messaging,
      free: {
        ...features.messaging?.free,
        maxMessagesPerDay,
        maxActiveMatches,
        label: `${maxMessagesPerDay} messages/day - ${maxActiveMatches} active match`
      }
    },
    requests: {
      ...features.requests,
      free: {
        ...features.requests?.free,
        maxRequestsPerDay,
        label: `Send ${maxRequestsPerDay} requests/day`
      }
    }
  };

  const effectivePayment = {
    ...payment,
    enabled:
      Boolean(billing.upiEnabled ?? payment.enabled) ||
      Boolean(billing.qrEnabled ?? payment.methods?.qr?.enabled) ||
      Boolean(billing.bankEnabled ?? payment.methods?.bank?.enabled),
    methods: {
      ...payment.methods,
      upi: {
        ...payment.methods?.upi,
        enabled: billing.upiEnabled !== false,
        id: String(billing.upiId || payment.methods?.upi?.id || ''),
        name: payment.methods?.upi?.name || 'Admin UPI'
      },
      qr: {
        ...payment.methods?.qr,
        enabled: billing.qrEnabled !== false
      },
      bank: {
        enabled: billing.bankEnabled !== false,
        accountHolder: String(billing.accountHolder || ''),
        bankName: String(billing.bankName || ''),
        accountNumber: String(billing.accountNumber || ''),
        ifscCode: String(billing.ifscCode || '')
      }
    },
    offerBanner: {
      ...payment.offerBanner,
      enabled: Boolean(billing.offerText || payment.offerBanner?.enabled),
      text: String(billing.offerText || payment.offerBanner?.text || '')
    },
    paymentInstructions: String(billing.paymentInstructions || '')
  };

  const effectiveCoupons = billing.couponsEnabled
    ? [{
        code: String(billing.couponCode || '').trim().toUpperCase(),
        discountPct: Math.max(0, Math.min(95, Number(billing.couponDiscountPct) || 0))
      }].filter((item) => item.code)
    : (coupons.enabled ? coupons.list : []);

  res.json({
    success: true,
    data: {
      plans: effectivePlans,
      features: effectiveFeatures,
      payment: {
        enabled: effectivePayment.enabled,
        methods: effectivePayment.methods,
        offerBanner: effectivePayment.offerBanner,
        paymentInstructions: effectivePayment.paymentInstructions
      },
      globalOverride: {
        ...globalOverride,
        premiumFree,
        disableFreeMode: !freeEnabled
      },
      featureLocks,
      coupons: effectiveCoupons
    }
  });
}));

/**
 * GET /api/config/features
 * 
 * Returns feature availability for current user based on their subscription.
 * 
 * Authenticated only - uses user's subscription status
 */
router.get('/features', verifyFirebaseOrJwtAuth, asyncHandler(async (req, res) => {
  const userId = req.userId;
  
  // Get user and their subscription status
  const user = await User.findById(userId).select('subscription_status').lean();
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Determine if user is premium
  const isPremium = user.subscription_status === 'active';
  
  // Apply global override if enabled
  const globalOverride = pricingConfig.globalOverride;
  const effectivelyPremium = isPremium || globalOverride.premiumFree;

  // Build feature set for this user
  const userFeatures = {};
  const { features } = pricingConfig;

  Object.keys(features).forEach(featureKey => {
    const feature = features[featureKey];
    const plan = effectivelyPremium ? feature.premium : feature.free;

    userFeatures[featureKey] = {
      enabled: plan.enabled,
      ...plan
    };
  });

  res.json({
    success: true,
    data: {
      userId,
      subscription: user.subscription_status,
      isPremium: effectivelyPremium,
      features: userFeatures,
      globalOverride
    }
  });
}));

/**
 * GET /api/config/plan/:planId
 * 
 * Get details for a specific plan (free or premium)
 */
router.get('/plan/:planId', asyncHandler(async (req, res) => {
  const { planId } = req.params;
  
  const plan = pricingConfig.plans[planId];
  if (!plan) {
    throw new AppError('Plan not found. Valid plans: free, premium', 404);
  }

  const features = pricingConfig.features;
  
  // Get all features for this plan
  const planFeatures = {};
  Object.keys(features).forEach(featureKey => {
    planFeatures[featureKey] = features[featureKey][planId];
  });

  res.json({
    success: true,
    data: {
      plan,
      features: planFeatures
    }
  });
}));

/**
 * GET /api/config/support-contact
 *
 * Public support/contact details managed from admin portal settings.
 */
router.get('/support-contact', asyncHandler(async (req, res) => {
  const defaults = {
    supportEmail: 'support@cudaters.in',
    escalationEmail: 'escalations@cudaters.in',
    supportPhone: '',
    whatsapp: '',
    instagramId: '',
    telegramId: '',
    supportHandle: 'CU-Daters Support',
    helpCenterUrl: '',
    officeHours: 'Mon-Sat, 9:00 AM - 8:00 PM',
    responseSlaHours: '24'
  };

  const setting = await AppSetting.findOne({ key: 'support_contact_config' }).lean();
  const rawValue = setting?.value;
  let parsed = {};

  if (typeof rawValue === 'string') {
    try {
      parsed = JSON.parse(rawValue);
    } catch {
      parsed = {};
    }
  } else if (rawValue && typeof rawValue === 'object') {
    parsed = rawValue;
  }

  return res.json({
    success: true,
    data: {
      ...defaults,
      ...parsed
    }
  });
}));

/**
 * GET /api/config/legal-content
 *
 * Public legal metadata managed from admin settings.
 */
router.get('/legal-content', asyncHandler(async (req, res) => {
  const defaults = {
    appName: 'CU-Daters',
    companyName: 'CU-Daters',
    termsLastUpdated: 'March 2026',
    privacyLastUpdated: 'March 2026',
    legalEmail: 'legal@cudaters.in',
    privacyEmail: 'privacy@cudaters.in',
    supportEmail: 'support@cudaters.in',
    disputeResponseDays: '7',
    arbitrationCity: 'Chandigarh, India',
    governingLaw: 'Laws of India',
    mailingAddress: 'Chandigarh University, Chandigarh, India',
    termsBlocks: [
      {
        title: 'Acceptance of Terms',
        body: 'By using the app, users agree to these terms and any future updates announced by the platform.'
      },
      {
        title: 'User Conduct',
        body: 'Users must behave respectfully and must not engage in harassment, fraud, abuse, impersonation, or illegal activity.'
      }
    ],
    privacyBlocks: [
      {
        title: 'Information We Collect',
        body: 'We collect account, profile, and usage information required to provide the service and keep the community safe.'
      },
      {
        title: 'How We Use Information',
        body: 'Information is used for account management, feature delivery, moderation, support, and legal compliance.'
      }
    ]
  };

  const setting = await AppSetting.findOne({ key: 'legal_content_config' }).lean();
  const rawValue = setting?.value;
  let parsed = {};

  if (typeof rawValue === 'string') {
    try {
      parsed = JSON.parse(rawValue);
    } catch {
      parsed = {};
    }
  } else if (rawValue && typeof rawValue === 'object') {
    parsed = rawValue;
  }

  return res.json({
    success: true,
    data: {
      ...defaults,
      ...parsed
    }
  });
}));

/**
 * ADMIN ONLY ENDPOINTS
 * 
 * These would be called from admin panel to update config.
 * In production, you'd want to:
 * 1. Add admin secret key verification
 * 2. Store config in database instead of file
 * 3. Log all changes
 * 4. Invalidate cache after updates
 */

/**
 * Admin: Update plan price
 * POST /api/config/admin/update-price
 */
router.post('/admin/update-price', asyncHandler(async (req, res) => {
  // TODO: Add admin key verification
  // const { adminKey } = req.headers;
  // if (adminKey !== process.env.ADMIN_CONFIG_KEY) throw new AppError('Invalid key', 403);

  const { planId, newPrice } = req.body;

  if (!pricingConfig.plans[planId]) {
    throw new AppError('Invalid plan ID', 400);
  }

  if (typeof newPrice !== 'number' || newPrice < 0) {
    throw new AppError('Price must be a non-negative number', 400);
  }

  // Update the config
  pricingConfig.plans[planId].price = newPrice;

  console.log(`✅ [ADMIN] Updated ${planId} price to ₹${newPrice}`);

  res.json({
    success: true,
    message: `${planId} plan price updated to ₹${newPrice}`,
    newConfig: pricingConfig.plans[planId]
  });
}));

/**
 * Admin: Toggle feature
 * POST /api/config/admin/toggle-feature
 */
router.post('/admin/toggle-feature', asyncHandler(async (req, res) => {
  const { featureKey, plan, enabled } = req.body;

  if (!pricingConfig.features[featureKey]) {
    throw new AppError('Feature not found', 400);
  }

  if (!['free', 'premium'].includes(plan)) {
    throw new AppError('Invalid plan. Must be: free or premium', 400);
  }

  // Update the config
  pricingConfig.features[featureKey][plan].enabled = Boolean(enabled);

  console.log(`✅ [ADMIN] ${enabled ? 'Enabled' : 'Disabled'} ${featureKey} for ${plan} plan`);

  res.json({
    success: true,
    message: `${featureKey} ${enabled ? 'enabled' : 'disabled'} for ${plan} plan`,
    feature: pricingConfig.features[featureKey]
  });
}));

/**
 * Admin: Update feature limit
 * POST /api/config/admin/update-limit
 */
router.post('/admin/update-limit', asyncHandler(async (req, res) => {
  const { featureKey, plan, limitKey, value } = req.body;

  if (!pricingConfig.features[featureKey]) {
    throw new AppError('Feature not found', 400);
  }

  if (!['free', 'premium'].includes(plan)) {
    throw new AppError('Invalid plan', 400);
  }

  // Update the limit
  pricingConfig.features[featureKey][plan][limitKey] = value;

  console.log(`✅ [ADMIN] Updated ${featureKey}.${plan}.${limitKey} = ${value}`);

  res.json({
    success: true,
    message: `Limit updated`,
    feature: pricingConfig.features[featureKey]
  });
}));

/**
 * Admin: Global override (Premium for all / Disable free mode)
 * POST /api/config/admin/global-override
 */
router.post('/admin/global-override', asyncHandler(async (req, res) => {
  const { premiumFree, disableFreeMode } = req.body;

  if (typeof premiumFree === 'boolean') {
    pricingConfig.globalOverride.premiumFree = premiumFree;
    console.log(`✅ [ADMIN] Global premiumFree: ${premiumFree}`);
  }

  if (typeof disableFreeMode === 'boolean') {
    pricingConfig.globalOverride.disableFreeMode = disableFreeMode;
    console.log(`✅ [ADMIN] Global disableFreeMode: ${disableFreeMode}`);
  }

  res.json({
    success: true,
    message: 'Global override updated',
    globalOverride: pricingConfig.globalOverride
  });
}));

/**
 * Admin: Update payment config
 * POST /api/config/admin/payment-config
 */
router.post('/admin/payment-config', asyncHandler(async (req, res) => {
  const {
    upiId,
    offerText,
    enabled,
    upiEnabled,
    qrEnabled,
    bankEnabled,
    accountHolder,
    bankName,
    accountNumber,
    ifscCode,
    paymentInstructions
  } = req.body;

  if (typeof upiId === 'string') pricingConfig.payment.methods.upi.id = upiId;
  if (typeof offerText === 'string') pricingConfig.payment.offerBanner.text = offerText;
  if (typeof enabled === 'boolean') pricingConfig.payment.enabled = enabled;
  if (typeof upiEnabled === 'boolean') pricingConfig.payment.methods.upi.enabled = upiEnabled;
  if (typeof qrEnabled === 'boolean') pricingConfig.payment.methods.qr.enabled = qrEnabled;
  if (!pricingConfig.payment.methods.bank) {
    pricingConfig.payment.methods.bank = {
      enabled: true,
      accountHolder: '',
      bankName: '',
      accountNumber: '',
      ifscCode: ''
    };
  }
  if (typeof bankEnabled === 'boolean') pricingConfig.payment.methods.bank.enabled = bankEnabled;
  if (typeof accountHolder === 'string') pricingConfig.payment.methods.bank.accountHolder = accountHolder;
  if (typeof bankName === 'string') pricingConfig.payment.methods.bank.bankName = bankName;
  if (typeof accountNumber === 'string') pricingConfig.payment.methods.bank.accountNumber = accountNumber;
  if (typeof ifscCode === 'string') pricingConfig.payment.methods.bank.ifscCode = ifscCode;
  if (typeof paymentInstructions === 'string') pricingConfig.payment.paymentInstructions = paymentInstructions;

  console.log(`✅ [ADMIN] Payment config updated`);

  res.json({
    success: true,
    message: 'Payment configuration updated',
    config: pricingConfig.payment
  });
}));

export default router;
