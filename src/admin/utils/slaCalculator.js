// ============================================================================
// slaCalculator.js - SLA Tracking for Moderation & Support
// ============================================================================
// Calculates SLA status for cases, reports, tickets
// Used for: highlighting backlog, auto-escalation, performance metrics

export const SLA_CONFIGS = {
  // Registration approvals: 4 hours
  registration_approval: {
    warning: 2 * 60 * 60 * 1000,  // 2 hours
    critical: 4 * 60 * 60 * 1000, // 4 hours
    name: '4 hour SLA'
  },
  // Profile approvals: 24 hours
  profile_approval: {
    warning: 12 * 60 * 60 * 1000,  // 12 hours
    critical: 24 * 60 * 60 * 1000, // 24 hours
    name: '24 hour SLA'
  },
  // Reports: 4 hours for critical, 24 hours for high
  report_critical: {
    warning: 1 * 60 * 60 * 1000,   // 1 hour
    critical: 4 * 60 * 60 * 1000,  // 4 hours
    name: '4 hour SLA (critical)'
  },
  report_high: {
    warning: 8 * 60 * 60 * 1000,   // 8 hours
    critical: 24 * 60 * 60 * 1000, // 24 hours
    name: '24 hour SLA (high priority)'
  },
  report_normal: {
    warning: 24 * 60 * 60 * 1000,  // 24 hours
    critical: 3 * 24 * 60 * 60 * 1000, // 3 days
    name: '3 day SLA (normal)'
  },
  // Support tickets: 2 hours for urgent, 24 hours for normal
  support_urgent: {
    warning: 30 * 60 * 1000,        // 30 min
    critical: 2 * 60 * 60 * 1000,   // 2 hours
    name: '2 hour SLA (urgent)'
  },
  support_normal: {
    warning: 12 * 60 * 60 * 1000,   // 12 hours
    critical: 24 * 60 * 60 * 1000,  // 24 hours
    name: '24 hour SLA (normal)'
  }
};

/**
 * Calculate SLA status for a single case
 * @param {Date|string} createdAt - When was the case created
 * @param {string} slaType - SLA configuration key (from SLA_CONFIGS)
 * @param {boolean} isResolved - Whether the case is resolved
 * @returns {Object} { status: 'ok'|'warning'|'breached', timeLeft: ms, percentage: 0-100, config }
 */
export function calculateSLAStatus(createdAt, slaType = 'report_normal', isResolved = false) {
  if (!SLA_CONFIGS[slaType]) {
    return { status: 'unknown', message: `Unknown SLA type: ${slaType}` };
  }

  if (isResolved) {
    return { status: 'resolved', message: 'Case resolved' };
  }

  const config = SLA_CONFIGS[slaType];
  const now = Date.now();
  const createdTime = new Date(createdAt).getTime();
  const elapsedTime = now - createdTime;
  const timeLeft = config.critical - elapsedTime;

  let status = 'ok';
  if (elapsedTime >= config.critical) {
    status = 'breached';
  } else if (elapsedTime >= config.warning) {
    status = 'warning';
  }

  const percentage = Math.min(100, Math.round((elapsedTime / config.critical) * 100));

  return {
    status,
    timeLeft: Math.max(0, timeLeft),
    percentage,
    hoursRemaining: Math.max(0, Math.round(timeLeft / (60 * 60 * 1000) * 10) / 10),
    config
  };
}

/**
 * Get human-readable SLA status
 */
export function getSLAStatusDisplay(slaStatus) {
  const { status, hoursRemaining } = slaStatus;

  if (status === 'resolved') {
    return { label: 'Resolved', badge: '✓', color: '#10B981' };
  }

  if (status === 'breached') {
    return { label: 'SLA Breached', badge: '⚠️', color: '#EF4444', urgent: true };
  }

  if (status === 'warning') {
    return { 
      label: `${hoursRemaining}h remaining`, 
      badge: '⏱️', 
      color: '#F59E0B' 
    };
  }

  return { label: `${hoursRemaining}h remaining`, badge: '✓', color: '#3B82F6' };
}

/**
 * Calculate queue metrics (for overview/dashboard)
 */
export function calculateQueueMetrics(items = [], slaType = 'report_normal') {
  if (items.length === 0) {
    return {
      total: 0,
      breached: 0,
      warning: 0,
      ok: 0,
      avgAgeHours: 0,
      oldestHours: 0
    };
  }

  let breached = 0;
  let warning = 0;
  let ok = 0;
  let totalAge = 0;
  let oldestAge = 0;

  items.forEach(item => {
    const createdAt = item.createdAt || item.created_at || item.timestamp;
    const isResolved = item.status === 'resolved' || item.status === 'closed';
    const sla = calculateSLAStatus(createdAt, slaType, isResolved);

    if (sla.status === 'breached') breached++;
    else if (sla.status === 'warning') warning++;
    else ok++;

    const ageHours = (Date.now() - new Date(createdAt).getTime()) / (60 * 60 * 1000);
    totalAge += ageHours;
    oldestAge = Math.max(oldestAge, ageHours);
  });

  return {
    total: items.length,
    breached,
    warning,
    ok,
    breachedPercentage: Math.round((breached / items.length) * 100),
    avgAgeHours: Math.round(totalAge / items.length * 10) / 10,
    oldestHours: Math.round(oldestAge * 10) / 10,
    health: breached > 0 ? 'critical' : warning > 0 ? 'warning' : 'healthy'
  };
}

/**
 * Get SLA health badge for display
 */
export function getSLAHealthBadge(queueMetrics) {
  if (queueMetrics.breached > 0) {
    return {
      label: `${queueMetrics.breached} breached`,
      color: '#EF4444',
      badge: '🚨',
      urgent: true
    };
  }

  if (queueMetrics.warning > 0) {
    return {
      label: `${queueMetrics.warning} at risk`,
      color: '#F59E0B',
      badge: '⚠️'
    };
  }

  return {
    label: 'Healthy',
    color: '#10B981',
    badge: '✓'
  };
}

/**
 * Determine if case should auto-escalate based on SLA
 */
export function shouldAutoEscalate(createdAt, slaType, currentEscalationLevel = 0) {
  const sla = calculateSLAStatus(createdAt, slaType);

  if (currentEscalationLevel === 0 && sla.status === 'warning') {
    return { escalate: true, level: 1, reason: 'SLA warning - escalate to manager' };
  }

  if (currentEscalationLevel <= 1 && sla.status === 'breached') {
    return { escalate: true, level: 2, reason: 'SLA breached - escalate to head of trust & safety' };
  }

  return { escalate: false };
}

export default {
  SLA_CONFIGS,
  calculateSLAStatus,
  getSLAStatusDisplay,
  calculateQueueMetrics,
  getSLAHealthBadge,
  shouldAutoEscalate
};
