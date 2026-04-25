// src/backend/services/notificationService.js
const admin = require('firebase-admin');

class NotificationService {
  constructor() {
    this.db = admin.firestore();
    this.messaging = admin.messaging();
  }

  /**
   * Send notification when payment submitted
   */
  async notifyPaymentSubmitted(user_id, request_id) {
    try {
      const message = {
        notification: {
          title: '💳 Payment Submitted',
          body: 'Your payment proof has been submitted for review. You will receive approval within 24 hours.'
        },
        data: {
          type: 'payment_submitted',
          request_id,
          action: 'OPEN_SUBSCRIPTION_STATUS'
        },
        webpush: {
          notification: {
            icon: '/notification-payment.png',
            badge: '/badge.png',
            tag: 'payment-submission'
          }
        }
      };

      await this.sendToUser(user_id, message);
      console.log(`Notification sent: payment_submitted for user ${user_id}`);
    } catch (error) {
      console.error('Error notifying payment submitted:', error);
    }
  }

  /**
   * Send notification when payment approved
   */
  async notifyPaymentApproved(user_id, request_id, subscription_expiry) {
    try {
      const expiryDate = new Date(subscription_expiry).toLocaleDateString();

      const message = {
        notification: {
          title: '✅ Payment Approved!',
          body: `Your subscription is now active! Premium features unlocked until ${expiryDate}.`
        },
        data: {
          type: 'payment_approved',
          request_id,
          subscription_expiry: subscription_expiry.toISOString(),
          action: 'OPEN_DASHBOARD'
        },
        webpush: {
          notification: {
            icon: '/notification-success.png',
            badge: '/badge.png',
            tag: 'payment-approval'
          }
        }
      };

      await this.sendToUser(user_id, message);
      console.log(`Notification sent: payment_approved for user ${user_id}`);
    } catch (error) {
      console.error('Error notifying payment approved:', error);
    }
  }

  /**
   * Send notification when payment rejected
   */
  async notifyPaymentRejected(user_id, request_id, reason, admin_note = null) {
    try {
      const reasonText = this.formatRejectionReason(reason);
      let bodyText = `Your payment was not approved. Reason: ${reasonText}`;
      
      if (admin_note) {
        bodyText += ` - ${admin_note}`;
      }
      
      bodyText += '. You can retry your submission.';

      const message = {
        notification: {
          title: '❌ Payment Not Approved',
          body: bodyText.substring(0, 150) // Notification body limit
        },
        data: {
          type: 'payment_rejected',
          request_id,
          rejection_reason: reason,
          admin_note: admin_note || '',
          action: 'OPEN_SUBSCRIPTION_STATUS'
        },
        webpush: {
          notification: {
            icon: '/notification-error.png',
            badge: '/badge.png',
            tag: 'payment-rejection'
          }
        }
      };

      await this.sendToUser(user_id, message);
      console.log(`Notification sent: payment_rejected for user ${user_id}`);
    } catch (error) {
      console.error('Error notifying payment rejected:', error);
    }
  }

  /**
   * Send renewal reminder 7 days before expiry
   */
  async notifyRenewalReminder(user_id, subscription_id, expiry_date) {
    try {
      const daysLeft = Math.ceil((new Date(expiry_date) - new Date()) / (1000 * 60 * 60 * 24));

      const message = {
        notification: {
          title: '📅 Subscription Expiring Soon',
          body: `Your subscription expires in ${daysLeft} days. Renew now to keep premium features active.`
        },
        data: {
          type: 'renewal_reminder',
          subscription_id,
          expiry_date: expiry_date.toISOString(),
          action: 'OPEN_SUBSCRIPTION_RENEWAL'
        },
        webpush: {
          notification: {
            icon: '/notification-reminder.png',
            badge: '/badge.png',
            tag: 'renewal-reminder'
          }
        }
      };

      await this.sendToUser(user_id, message);
      console.log(`Notification sent: renewal_reminder for user ${user_id}`);
    } catch (error) {
      console.error('Error notifying renewal reminder:', error);
    }
  }

  /**
   * Send admin notification for high fraud score
   */
  async notifyAdminHighFraudScore(request_id, fraud_score) {
    try {
      // For demonstration - in production, send to admin topic
      const message = {
        notification: {
          title: `🚨 High Fraud Score: ${fraud_score}/100`,
          body: `Subscription request ${request_id} needs priority review.`
        },
        data: {
          type: 'high_fraud_alert',
          request_id,
          fraud_score: fraud_score.toString(),
          action: 'ADMIN_OPEN_REQUEST'
        }
      };

      // Send to admin topic
      await this.messaging.send({
        ...message,
        topic: 'admin-fraud-alerts'
      });

      console.log(`Notification sent: high_fraud_alert for request ${request_id}`);
    } catch (error) {
      console.error('Error notifying admin:', error);
    }
  }

  /**
   * Send notification to user by FCM token
   */
  async sendToUser(user_id, message) {
    try {
      // Get user's FCM token from Firestore
      const userDoc = await this.db.collection('users').doc(user_id).get();
      
      if (!userDoc.exists) {
        console.warn(`User ${user_id} not found in Firestore`);
        return;
      }

      const userData = userDoc.data();
      const fcmToken = userData.fcm_token;

      if (!fcmToken) {
        console.warn(`No FCM token for user ${user_id}`);
        return;
      }

      // Send notification
      const response = await this.messaging.send({
        ...message,
        token: fcmToken
      });

      console.log(`Notification delivered to user ${user_id}:`, response);
      
      // Log notification delivery
      await this.db.collection('notifications').add({
        user_id,
        type: message.data?.type,
        title: message.notification?.title,
        body: message.notification?.body,
        delivered_at: new Date(),
        status: 'delivered'
      });

    } catch (error) {
      console.error(`Error sending notification to user ${user_id}:`, error);
      
      // Log failed notification
      try {
        await this.db.collection('notifications').add({
          user_id,
          type: message.data?.type,
          delivered_at: new Date(),
          status: 'failed',
          error: error.message
        });
      } catch (logError) {
        console.error('Error logging failed notification:', logError);
      }
    }
  }

  /**
   * Format rejection reason for display
   */
  formatRejectionReason(reason) {
    const reasons = {
      'payment_amount_mismatch': 'The amount doesnt match',
      'duplicate_payment_id': 'This payment ID has already been used',
      'invalid_screenshot': 'The screenshot appears to be tampered or invalid',
      'suspicious_activity': 'Unusual pattern detected',
      'payment_id_invalid': 'Invalid payment ID format',
      'user_account_suspicious': 'Suspicious account activity',
      'screenshot_unclear': 'Screenshot is too unclear to verify',
      'other': 'Verification could not be completed'
    };

    return reasons[reason] || reason;
  }

  /**
   * Subscribe user to notification topics
   */
  async subscribeToTopics(fcm_token, user_id) {
    try {
      // Subscribe to user-specific topic for targeted notifications
      await this.messaging.subscribeToTopic([fcm_token], `user-${user_id}`);
      
      // Subscribe to general topic for app-wide announcements
      await this.messaging.subscribeToTopic([fcm_token], 'app-announcements');
      
      // Subscribe to admin topic if user is admin
      // This would be determined by user role
      
      console.log(`User ${user_id} subscribed to notification topics`);
    } catch (error) {
      console.error('Error subscribing to topics:', error);
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(user_id) {
    try {
      const message = {
        notification: {
          title: '🧪 Test Notification',
          body: 'This is a test notification from SeeU-Daters.'
        },
        data: {
          type: 'test_notification',
          timestamp: new Date().toISOString()
        }
      };

      await this.sendToUser(user_id, message);
      console.log(`Test notification sent to user ${user_id}`);
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }
}

module.exports = new NotificationService();
