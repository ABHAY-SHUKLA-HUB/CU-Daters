// ============================================================================
// useRiskScoring.js - User Risk Scoring Engine
// ============================================================================
// Calculates risk scores for users based on multiple factors
// Used for: user directory display, registration approval, match safety

import React from 'react';

export const RISK_LEVELS = {
  LOW: { score: 0, label: 'Low Risk', color: '#10B981', badge: '🟢' },
  MEDIUM: { score: 1, label: 'Medium Risk', color: '#F59E0B', badge: '🟡' },
  HIGH: { score: 2, label: 'High Risk', color: '#EF4444', badge: '🔴' },
  CRITICAL: { score: 3, label: 'Critical Risk', color: '#991B1B', badge: '🚨' }
};

export function useRiskScoring() {
  // Calculate overall risk score (0-100)
  // Factors weighted by importance
  const calculateRiskScore = React.useCallback((user, context = {}) => {
    if (!user) return 0;

    let score = 0;

    // 1. Report History (0-25)
    const reportCount = (user.report_count || user.reportsAgainst?.length || 0);
    const reportScore = Math.min(25, reportCount * 5);
    score += reportScore;

    // 2. Document Quality (0-20)
    // Factors: missing docs, low-quality ID, no face verification
    const hasIdentityVerified = user.identity_verified || user.verification_status?.includes('identity');
    const hasFaceVerified = user.face_verified || user.verification_status?.includes('face');
    const documentScore = (!hasIdentityVerified ? 10 : 0) + (!hasFaceVerified ? 10 : 0);
    score += documentScore;

    // 3. Velocity Risk (0-15)
    // Rapid signup → profile completion → matches (potential bot/catfish)
    const daysOld = (Date.now() - new Date(user.createdAt || user.created_at).getTime()) / (24 * 60 * 60 * 1000);
    if (daysOld < 7 && user.match_count > 10) {
      score += 12; // Suspicious rapid matching
    } else if (daysOld < 1 && user.profile_completed_at) {
      score += 8; // Rapid completion
    }

    // 4. Payment Disputes (0-15)
    const paymentDisputes = user.payment_disputes || context.paymentIssues || 0;
    const chargebacks = user.chargebacks || context.chargebacks || 0;
    score += Math.min(15, (paymentDisputes * 5) + (chargebacks * 10));

    // 5. Device Fingerprint (0-10)
    // Multiple accounts from same device
    const deviceCount = context.devicesCount || 1;
    if (deviceCount > 3) score += 10;
    else if (deviceCount > 2) score += 6;
    else if (deviceCount > 1) score += 3;

    // 6. Message Patterns (0-10)
    // Spam detection, rapid messages, suspicious content
    const messageVelocity = context.messagesPerDay || 0;
    if (messageVelocity > 50) score += 8;
    else if (messageVelocity > 20) score += 4;

    // 7. Match Behavior (0-5)
    // Unusual matching patterns (matching everyone, no interaction, etc)
    const matchConversionRate = context.matchConversionRate || 0;
    if (matchConversionRate < 0.05) score += 3; // Matches but never messages

    return Math.min(100, Math.round(score));
  }, []);

  // Get risk level based on score
  const getRiskLevel = React.useCallback((score) => {
    if (score >= 70) return RISK_LEVELS.CRITICAL;
    if (score >= 50) return RISK_LEVELS.HIGH;
    if (score >= 25) return RISK_LEVELS.MEDIUM;
    return RISK_LEVELS.LOW;
  }, []);

  // Generate risk flags for user
  const generateRiskFlags = React.useCallback((user, context = {}) => {
    const flags = [];

    const reportCount = (user.report_count || user.reportsAgainst?.length || 0);
    if (reportCount >= 3) flags.push('repeated_reports');
    if (reportCount >= 1) flags.push('reported_user');

    const daysOld = (Date.now() - new Date(user.createdAt || user.created_at).getTime()) / (24 * 60 * 60 * 1000);
    if (daysOld < 7 && user.match_count > 10) flags.push('rapid_matching');
    if (daysOld < 1 && user.profile_completed_at) flags.push('rapid_signup');

    if (!user.identity_verified && !user.verification_status?.includes('identity')) {
      flags.push('unverified_identity');
    }

    if (!user.face_verified && !user.verification_status?.includes('face')) {
      flags.push('unverified_face');
    }

    if (user.account_status === 'suspended' || user.status === 'suspended') {
      flags.push('currently_suspended');
    }

    if (user.account_status === 'banned' || user.status === 'banned') {
      flags.push('permanently_banned');
    }

    if (context.paymentDisputes > 0) flags.push('payment_disputes');
    if (context.chargebacks > 0) flags.push('chargebacks');
    if (context.devicesCount > 2) flags.push('multi_device_user');

    if (context.messagesPerDay > 50) flags.push('spam_pattern');
    if (context.matchConversionRate < 0.05) flags.push('low_interaction');

    return flags;
  }, []);

  // Get risk timeline for user (events that affected risk score)
  const generateRiskTimeline = React.useCallback((user, context = {}) => {
    const timeline = [];

    // Report filed against user
    if (context.reports) {
      context.reports.forEach(report => {
        timeline.push({
          timestamp: new Date(report.createdAt || report.created_at),
          event: 'Report filed',
          category: 'report',
          severity: 'high',
          details: `Reported for: ${report.reason || 'unspecified'}`
        });
      });
    }

    // Account suspension/ban
    if (context.moderationHistory) {
      context.moderationHistory.forEach(action => {
        if (['suspended', 'banned'].includes(action.action)) {
          timeline.push({
            timestamp: new Date(action.timestamp),
            event: action.action === 'banned' ? 'Account banned' : 'Account suspended',
            category: 'moderation',
            severity: 'critical',
            details: action.reason
          });
        }
      });
    }

    // Payment issues
    if (context.paymentDisputes > 0) {
      timeline.push({
        timestamp: new Date(),
        event: `${context.paymentDisputes} payment dispute(s)`,
        category: 'payment',
        severity: 'high',
        details: 'Chargeback or dispute filed'
      });
    }

    // Identity verification
    if (user.identity_verified) {
      timeline.push({
        timestamp: new Date(user.identity_verified_at || user.updatedAt),
        event: 'Identity verified',
        category: 'verification',
        severity: 'positive',
        details: 'Government ID verified'
      });
    }

    return timeline.sort((a, b) => b.timestamp - a.timestamp);
  }, []);

  return {
    calculateRiskScore,
    getRiskLevel,
    generateRiskFlags,
    generateRiskTimeline,
    RISK_LEVELS
  };
}

export default useRiskScoring;
