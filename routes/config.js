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

  res.json({
    success: true,
    data: {
      plans,
      features,
      payment: {
        enabled: payment.enabled,
        methods: payment.methods,
        offerBanner: payment.offerBanner
      },
      globalOverride,
      featureLocks,
      coupons: coupons.enabled ? coupons.list : []
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
  const { upiId, offerText, enabled } = req.body;

  if (upiId) pricingConfig.payment.methods.upi.id = upiId;
  if (offerText) pricingConfig.payment.offerBanner.text = offerText;
  if (typeof enabled === 'boolean') pricingConfig.payment.enabled = enabled;

  console.log(`✅ [ADMIN] Payment config updated`);

  res.json({
    success: true,
    message: 'Payment configuration updated',
    config: pricingConfig.payment
  });
}));

export default router;
