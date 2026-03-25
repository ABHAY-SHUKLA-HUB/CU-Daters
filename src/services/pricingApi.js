/**
 * Pricing Configuration Service
 * 
 * Fetches and caches pricing configuration from backend
 * Used by all pricing-related frontend components
 */

import api from './api';
import { safeGet } from '../utils/safeProperties';

let cachedConfig = null;
let cacheExpiry = 0;
const CACHE_DURATION = 30 * 1000; // 30 seconds

const DEFAULT_PRICING_CONFIG = {
  plans: {
    free: {
      id: 'free',
      name: 'Free',
      price: 0,
      currency: '₹',
      period: '/month',
      description: 'Perfect to get started',
      enabled: true,
      buttonText: 'Continue Free'
    },
    premium: {
      id: 'premium',
      name: 'Premium',
      price: 99,
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
      free: { enabled: true, maxMessagesPerDay: 50, maxActiveMatches: 1, label: '50 messages/day - 1 active match' },
      premium: { enabled: true, maxMessagesPerDay: Number.MAX_SAFE_INTEGER, maxActiveMatches: Number.MAX_SAFE_INTEGER, label: 'Unlimited messages - Unlimited matches' }
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
      free: { enabled: true, maxRequestsPerDay: 5, label: 'Send 5 requests/day' },
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
    enabled: true,
    methods: {
      upi: { enabled: true, id: '', name: 'Admin UPI' },
      qr: { enabled: true },
      bank: {
        enabled: true,
        accountHolder: 'CU Daters Pvt Ltd',
        bankName: 'HDFC Bank',
        accountNumber: '1234567890123456',
        ifscCode: 'HDFC0005678'
      }
    },
    offerBanner: { enabled: false, text: '' },
    paymentInstructions: 'Use your payment ID/UTR in submission for faster approval.'
  },
  globalOverride: { premiumFree: false, disableFreeMode: false },
  featureLocks: {},
  coupons: []
};

export const pricingApi = {
  /**
   * Get all pricing plans and features
   * Caches result for 5 minutes to reduce API calls
   */
  getPricingConfig: async (forceRefresh = false) => {
    try {
      // Return cached config if still valid
      if (cachedConfig && Date.now() < cacheExpiry && !forceRefresh) {
        return cachedConfig;
      }

      let config = {};
      try {
        const response = await api.get('/api/config/pricing');
        config = safeGet(response, 'data.data', {});
      } catch {
        // Backward-compatible fallback for deployments that don't have /api/config routes yet.
        const fallbackResponse = await api.get('/api/subscriptions/pricing-config');
        config = safeGet(fallbackResponse, 'data.data', {});
      }

      // Cache the config
      cachedConfig = config;
      cacheExpiry = Date.now() + CACHE_DURATION;

      return config;
    } catch (error) {
      console.error('[PRICING API] Error fetching pricing config:', error);

      // Never hard-fail pricing UI. Use last cache, then safe defaults.
      if (cachedConfig) {
        return cachedConfig;
      }

      return DEFAULT_PRICING_CONFIG;
    }
  },

  /**
   * Get features available to current user
   * Based on their subscription status
   */
  getUserFeatures: async () => {
    try {
      const response = await api.get('/api/config/features');
      return safeGet(response, 'data.data', {});
    } catch (error) {
      console.error('[PRICING API] Error fetching user features:', error);
      throw error;
    }
  },

  /**
   * Get details for a specific plan
   */
  getPlanDetails: async (planId) => {
    try {
      const response = await api.get(`/api/config/plan/${planId}`);
      return safeGet(response, 'data.data', {});
    } catch (error) {
      console.error(`[PRICING API] Error fetching ${planId} plan details:`, error);
      throw error;
    }
  },

  /**
   * Check if a feature is available for current user
   * Useful for conditional rendering
   */
  canAccessFeature: async (featureKey) => {
    try {
      const features = await pricingApi.getUserFeatures();
      const feature = safeGet(features, `features.${featureKey}`, {});
      return Boolean(feature.enabled);
    } catch (error) {
      console.error(`[PRICING API] Error checking feature access:`, error);
      return false; // Deny access on error (safer)
    }
  },

  /**
   * Get remaining limit for a feature
   * Returns { max, used, remaining }
   */
  getFeatureLimit: async (featureKey, limitType) => {
    try {
      const features = await pricingApi.getUserFeatures();
      const feature = safeGet(features, `features.${featureKey}`, {});

      return {
        max: feature[limitType] || Infinity,
        enabled: feature.enabled
      };
    } catch (error) {
      console.error('[PRICING API] Error getting feature limit:', error);
      return { max: 0, enabled: false };
    }
  }
};

export default pricingApi;
