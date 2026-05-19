import SupportTicket from '../models/SupportTicket.js';

const SUPPORT_REQUEST_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Auto-reject support requests that are pending for more than 5 minutes
 */
export const autoRejectPendingSupportRequests = async () => {
  try {
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - SUPPORT_REQUEST_TIMEOUT);

    // Find all pending requests created before the cutoff time
    const expiredRequests = await SupportTicket.find({
      status: 'pending',
      created_at: { $lt: cutoffTime },
      auto_rejected_at: { $exists: false }
    });

    if (expiredRequests.length === 0) {
      console.log('✓ No support requests to auto-reject');
      return;
    }

    // Update all expired requests
    const result = await SupportTicket.updateMany(
      {
        status: 'pending',
        created_at: { $lt: cutoffTime },
        auto_rejected_at: { $exists: false }
      },
      {
        $set: {
          status: 'rejected',
          auto_rejected_at: now,
          rejection_reason: 'No agent available - request auto-rejected after 5 minutes',
          updated_at: now
        }
      }
    );

    console.log(
      `✓ Auto-rejected ${result.modifiedCount} expired support requests (older than 5 minutes)`
    );

    // Log each rejection for tracking
    expiredRequests.forEach((request) => {
      console.log(
        `  - Request ${request._id} (user: ${request.user_id}) auto-rejected`
      );
    });

    return result.modifiedCount;
  } catch (error) {
    console.error('❌ Error in auto-reject support requests:', error);
    return 0;
  }
};

/**
 * Start the auto-reject interval
 * Runs every minute to check for expired requests
 */
export const startSupportAutoRejectInterval = () => {
  const INTERVAL = 60 * 1000; // Check every 1 minute

  console.log(
    '✓ Starting support request auto-reject interval (checks every 60 seconds)'
  );

  const intervalId = setInterval(async () => {
    await autoRejectPendingSupportRequests();
  }, INTERVAL);

  return intervalId;
};

/**
 * Stop the auto-reject interval
 */
export const stopSupportAutoRejectInterval = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId);
    console.log('✓ Stopped support request auto-reject interval');
  }
};
