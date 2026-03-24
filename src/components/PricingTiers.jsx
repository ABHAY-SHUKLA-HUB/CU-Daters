/**
 * SIMPLIFIED 2-TIER PRICING COMPONENT
 * 
 * Shows only: Free Plan vs Premium Plan (₹99/month)
 * Clean, minimal, premium-feeling design
 * 
 * Features:
 * - Auto-fetches pricing from backend
 * - Fully responsive
 * - Premium card highlighted with glow effect
 * - Clear CTA buttons
 * - Easy upgrade path
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import pricingApi from '../services/pricingApi';
import './PricingTiers.css';

const PricingTiers = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch pricing config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const data = await pricingApi.getPricingConfig(true);
        setConfig(data);
      } catch (err) {
        console.error('Error loading pricing:', err);
        setError('Failed to load pricing information');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleContinueFree = () => {
    if (isAuthenticated) {
      navigate('/dashboard?tab=discover');
    } else {
      navigate('/login');
    }
  };

  const handleUpgrade = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/premium-upgrade');
  };

  if (loading) {
    return (
      <div className="pricing-container loading">
        <div className="skeleton-card"></div>
        <div className="skeleton-card featured"></div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="pricing-container error">
        <p>{error || 'Unable to load pricing'}</p>
      </div>
    );
  }

  const freePlan = config.plans?.free;
  const premiumPlan = config.plans?.premium;

  if (!freePlan || !premiumPlan) {
    return <div className="pricing-container error"><p>Pricing configuration incomplete</p></div>;
  }

  return (
    <div className="pricing-container">
      <div className="pricing-header">
        <h2 className="pricing-title">Simple, Transparent Pricing</h2>
        <p className="pricing-subtitle">Start free, upgrade whenever you're ready</p>
      </div>

      <div className="pricing-cards-wrapper">
        {/* FREE PLAN CARD */}
        <div className={`pricing-card free-card`}>
          <div className="card-header">
            <h3 className="plan-name">{freePlan.name}</h3>
            <div className="price-section">
              <span className="price">{freePlan.currency}0</span>
              <span className="period">{freePlan.period}</span>
            </div>
            <p className="plan-description">{freePlan.description}</p>
          </div>

          <div className="card-features">
            <div className="features-list">
              {Object.entries(config.features).map(([key, feature]) => {
                const freeFeature = feature.free;
                return (
                  <div key={key} className="feature-item">
                    <span className="feature-icon">✔</span>
                    <span className="feature-text">{freeFeature.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card-footer">
            <button 
              className="plan-button free-button"
              onClick={handleContinueFree}
            >
              {freePlan.buttonText}
            </button>
            <p className="no-credit-needed">No credit card required</p>
          </div>
        </div>

        {/* PREMIUM PLAN CARD */}
        <div className="pricing-card premium-card featured-card">
          <div className="featured-badge">
            <span className="badge-star">⭐</span>
            <span className="badge-text">{premiumPlan.tag}</span>
          </div>

          <div className="card-header">
            <h3 className="plan-name">{premiumPlan.name}</h3>
            <div className="price-section">
              <span className="price">{premiumPlan.currency}{premiumPlan.price}</span>
              <span className="period">{premiumPlan.period}</span>
            </div>
            <p className="plan-description">{premiumPlan.description}</p>
          </div>

          <div className="card-features">
            <p className="features-title">Unlock everything:</p>
            <div className="features-list">
              {Object.entries(config.features).map(([key, feature]) => {
                const premiumFeature = feature.premium;
                return (
                  <div key={key} className="feature-item premium-feature">
                    <span className="feature-icon">✅</span>
                    <span className="feature-text">{premiumFeature.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card-footer">
            <button 
              className="plan-button premium-button"
              onClick={handleUpgrade}
            >
              {premiumPlan.buttonText}
            </button>
            <p className="payment-secure">💳 Secure payment • Auto-renew anytime</p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="pricing-faq">
        <h3>Frequently Asked Questions</h3>
        <div className="faq-item">
          <h4>Can I upgrade anytime?</h4>
          <p>Yes! Upgrade to Premium anytime. You'll gain instant access to all premium features.</p>
        </div>
        <div className="faq-item">
          <h4>Can I downgrade or get a refund?</h4>
          <p>You can cancel your subscription anytime. No refunds for partial months, but you can continue using Premium until your billing period ends.</p>
        </div>
        <div className="faq-item">
          <h4>What payment methods do you accept?</h4>
          <p>We accept UPI payments. Check the upgrade page for available payment methods.</p>
        </div>
      </div>
    </div>
  );
};

export default PricingTiers;
