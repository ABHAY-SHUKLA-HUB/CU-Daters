/**
 * PRICING PAGE - 2-Tier System (Free + Premium)
 * 
 * Simplified pricing page showing only:
 * - Free Plan (₹0/forever)
 * - Premium Plan (₹99/month)
 * 
 * This replaces the previous 4-tier system (Free, CU Crush+, Gold, Platinum)
 * Configuration is now admin-controlled via pricingConfig.js
 */

import React from 'react';
import PricingTiers from '../components/PricingTiers';

export default function Pricing() {
  return (
    <div className="pt-20 pb-20 min-h-screen bg-gray-50">
      <PricingTiers />
    </div>
  );
}
