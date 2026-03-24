// src/backend/services/fraudDetection.js
const SubscriptionRequest = require('../models/SubscriptionRequest');

class FraudDetectionService {
  /**
   * Calculate comprehensive fraud score for a payment submission
   * Returns score (0-100) and flags array
   */
  async calculateFraudScore(data) {
    const {
      user_id,
      payment_id,
      amount,
      expected_amount,
      payment_timestamp,
      screenshot_info,
      user_history,
      device_info
    } = data;

    let score = 0;
    let flags = [];

    // 1. Payment ID Validation (Check Format)
    if (!this.isValidUTR(payment_id)) {
      score += 40; // High penalty for invalid format
      flags.push('payment_id_invalid');
    }

    // 2. Check for Duplicate Payment ID
    const isDuplicate = await this.isDuplicatePaymentId(payment_id);
    if (isDuplicate) {
      score += 50; // Very high penalty - likely fraud
      flags.push('duplicate_payment_id');
    }

    // 3. Amount Mismatch
    if (Math.abs(amount - expected_amount) > 1) { // Allow 1 rupee tolerance
      score += 20;
      flags.push('amount_mismatch');
    }

    // 4. Payment Timestamp Analysis
    const timestampScore = this.analyzePaymentTimestamp(payment_timestamp);
    score += timestampScore.score;
    flags = [...flags, ...timestampScore.flags];

    // 5. First-time User (Additional scrutiny)
    if (!user_history || user_history.total_requests === 0) {
      score += 10;
      flags.push('first_time_user');
    }

    // 6. High Velocity Check (Multiple attempts in short time)
    if (user_history && user_history.recent_attempts > 2) {
      score += 25;
      flags.push('high_velocity');
    }

    // 7. Multiple Previous Failures
    if (user_history && user_history.failed_attempts > 2) {
      score += 20;
      flags.push('multiple_failures');
    }

    // 8. Screenshot Quality Analysis
    if (screenshot_info) {
      const screenshotScore = this.analyzeScreenshot(screenshot_info);
      score += screenshotScore.score;
      flags = [...flags, ...screenshotScore.flags];
    }

    // 9. Device Behavior Analysis
    if (device_info && user_history) {
      if (this.isDeviceChange(device_info, user_history.last_device_id)) {
        score += 15;
        flags.push('device_change');
      }

      if (this.isSuspiciousLocation(device_info, user_history.last_location)) {
        score += 10;
        flags.push('suspicious_device');
      }
    }

    // Ensure score is between 0-100
    score = Math.min(Math.max(score, 0), 100);

    // Remove duplicates
    flags = [...new Set(flags)];

    return {
      fraud_score: score,
      fraud_level: this.getFraudLevel(score),
      fraud_flags: flags,
      risk_assessment: this.getRiskAssessment(score, flags)
    };
  }

  /**
   * Validate UTR format (12 digits)
   */
  isValidUTR(utr) {
    if (!utr) return false;
    const utrRegex = /^\d{12}$/;
    return utrRegex.test(utr.toString());
  }

  /**
   * Check if payment ID already used (duplicate detection)
   */
  async isDuplicatePaymentId(payment_id) {
    try {
      const existing = await SubscriptionRequest.findOne({
        payment_id: payment_id,
        status: { $ne: 'rejected' }
      });
      return !!existing;
    } catch (error) {
      console.error('Error checking duplicate payment ID:', error);
      return false;
    }
  }

  /**
   * Analyze payment timestamp for suspicious patterns
   */
  analyzePaymentTimestamp(timestamp) {
    let score = 0;
    let flags = [];

    if (!timestamp) return { score, flags };

    const paymentTime = new Date(timestamp);
    const now = new Date();
    const timeDiff = now - paymentTime;
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    // Payment too old (> 24 hours)
    if (hoursDiff > 24) {
      score += 10;
      flags.push('old_timestamp');
    }

    // Payment in future
    if (timeDiff < 0) {
      score += 30;
      flags.push('future_timestamp');
    }

    // Unusual payment time (2 AM - 5 AM)
    const hour = paymentTime.getHours();
    if (hour >= 2 && hour <= 5) {
      score += 5; // Minor penalty
      flags.push('unusual_payment_time');
    }

    return { score, flags };
  }

  /**
   * Analyze screenshot for quality/authenticity
   */
  analyzeScreenshot(screenshot_info) {
    let score = 0;
    let flags = [];

    if (!screenshot_info) return { score, flags };

    // Low resolution screenshot
    if (screenshot_info.width < 720 || screenshot_info.height < 1280) {
      score += 15;
      flags.push('low_screenshot_quality');
    }

    // Very large file (might be edited/compressed)
    if (screenshot_info.size > 5 * 1024 * 1024) {
      score += 10;
      flags.push('suspicious_file_size');
    }

    // Very small file (might be fake/placeholder)
    if (screenshot_info.size < 50 * 1024) {
      score += 5;
      flags.push('suspicious_file_size');
    }

    // Invalid format
    if (!['image/jpeg', 'image/png'].includes(screenshot_info.mime_type)) {
      score += 25;
      flags.push('invalid_screenshot_format');
    }

    return { score, flags };
  }

  /**
   * Detect if device changed from user's historical device
   */
  isDeviceChange(currentDevice, lastDeviceId) {
    if (!lastDeviceId) return false;
    return currentDevice.device_id !== lastDeviceId;
  }

  /**
   * Detect if location is suspiciously different
   */
  isSuspiciousLocation(currentDevice, lastLocation) {
    if (!lastLocation || !currentDevice.location) return false;

    // Simple check: if country changed, it's suspicious
    return currentDevice.location.country !== lastLocation.country;
  }

  /**
   * Get fraud level based on score
   */
  getFraudLevel(score) {
    if (score < 30) return 'low';
    if (score < 60) return 'medium';
    if (score < 85) return 'high';
    return 'very_high';
  }

  /**
   * Get detailed risk assessment
   */
  getRiskAssessment(score, flags) {
    const assessment = {
      auto_approvable: false,
      requires_manual_review: false,
      requires_priority_review: false,
      recommendation: 'Review required'
    };

    if (score < 30 && !flags.includes('duplicate_payment_id')) {
      assessment.auto_approvable = true;
      assessment.recommendation = 'Can be auto-approved';
    } else if (score < 60) {
      assessment.requires_manual_review = true;
      assessment.recommendation = 'Standard review recommended';
    } else if (score < 85) {
      assessment.requires_manual_review = true;
      assessment.requires_priority_review = true;
      assessment.recommendation = 'Priority review recommended';
    } else {
      assessment.requires_manual_review = true;
      assessment.requires_priority_review = true;
      assessment.recommendation = 'Reject or escalate to security team';
    }

    // Check for immediate disqualifiers
    if (flags.includes('duplicate_payment_id') || flags.includes('payment_id_invalid')) {
      assessment.auto_approvable = false;
      assessment.recommendation = 'Reject immediately';
    }

    return assessment;
  }

  /**
   * Get user history for fraud analysis
   */
  async getUserHistory(user_id) {
    try {
      const requests = await SubscriptionRequest.find({ user_id })
        .sort({ created_at: -1 })
        .limit(10);

      if (requests.length === 0) {
        return {
          total_requests: 0,
          approved_requests: 0,
          rejected_requests: 0,
          failed_attempts: 0,
          recent_attempts: 0,
          last_device_id: null,
          last_location: null
        };
      }

      // Calculate stats
      const approvedCount = requests.filter(r => r.status === 'approved').length;
      const rejectedCount = requests.filter(r => r.status === 'rejected').length;
      const recentAttempts = requests.filter(r => {
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return new Date(r.created_at) > dayAgo;
      }).length;

      return {
        total_requests: requests.length,
        approved_requests: approvedCount,
        rejected_requests: rejectedCount,
        failed_attempts: rejectedCount,
        recent_attempts: recentAttempts,
        last_device_id: requests[0]?.fraud_details?.device_info || null,
        last_location: requests[0]?.fraud_details?.location || null
      };
    } catch (error) {
      console.error('Error getting user history:', error);
      return {
        total_requests: 0,
        approved_requests: 0,
        rejected_requests: 0,
        failed_attempts: 0,
        recent_attempts: 0,
        last_device_id: null,
        last_location: null
      };
    }
  }
}

module.exports = new FraudDetectionService();
