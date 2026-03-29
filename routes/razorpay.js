import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import { verifyAuth } from '../utils/auth.js';
import { errorResponse, successResponse, checkDuplicatePayment } from '../utils/validation.js';

const router = express.Router();

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ===== GET RAZORPAY KEY =====
router.get('/key', (req, res) => {
  try {
    res.json({ 
      keyId: process.env.RAZORPAY_KEY_ID,
      testMode: process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_')
    });
  } catch (err) {
    console.error('Error getting Razorpay key:', err);
    res.status(500).json(errorResponse('Failed to get Razorpay key'));
  }
});

// ===== CREATE ORDER =====
router.post('/order', verifyAuth, async (req, res) => {
  try {
    const { amount, planType = 'monthly' } = req.body;
    const userId = req.user?.id || req.userId;

    // Validate amount
    if (!amount || amount < 1) {
      return res.status(400).json(errorResponse('Invalid amount'));
    }

    // Check for duplicate recent payments
    const isDuplicate = await checkDuplicatePayment(userId, amount);
    if (isDuplicate) {
      return res.status(400).json(errorResponse('Duplicate payment detected. Please try again in a moment.'));
    }

    // Create order
    const orderOptions = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: {
        userId: userId,
        planType: planType,
        createdAt: new Date().toISOString()
      }
    };

    const order = await razorpayInstance.orders.create(orderOptions);

    res.json(successResponse('Order created successfully', {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt
    }));
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    res.status(500).json(errorResponse('Failed to create order'));
  }
});

// ===== VERIFY PAYMENT =====
router.post('/verify', verifyAuth, async (req, res) => {
  try {
    const { orderId, paymentId, signature, planType = 'monthly', amount } = req.body;
    const userId = req.user?.id || req.userId;

    // Validate required fields
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json(errorResponse('Missing required payment details'));
    }

    // Verify signature
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${orderId}|${paymentId}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== signature) {
      console.warn(`Invalid signature for order ${orderId}`);
      return res.status(400).json(errorResponse('Payment verification failed - invalid signature'));
    }

    // Get or create subscription
    let subscription = await Subscription.findOne({ userId });
    
    if (!subscription) {
      subscription = new Subscription({
        userId,
        planType,
        status: 'active',
        startDate: new Date(),
        lastPaymentId: paymentId,
        lastTransactionId: orderId,
        paymentMethod: 'razorpay'
      });
    } else {
      subscription.planType = planType;
      subscription.status = 'active';
      subscription.lastPaymentId = paymentId;
      subscription.lastTransactionId = orderId;
      subscription.paymentMethod = 'razorpay';
      subscription.startDate = new Date();
    }

    // Calculate expiry based on plan type
    const expiryDate = new Date();
    switch (planType) {
      case 'monthly':
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        break;
      case 'quarterly':
        expiryDate.setMonth(expiryDate.getMonth() + 3);
        break;
      case 'yearly':
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        break;
      default:
        expiryDate.setMonth(expiryDate.getMonth() + 1);
    }

    subscription.expiryDate = expiryDate;
    await subscription.save();

    // Update user
    const user = await User.findById(userId);
    if (user) {
      user.isSubscribed = true;
      user.subscriptionStatus = 'active';
      user.subscriptionPlan = planType;
      user.lastSubscriptionId = subscription._id;
      user.lastRazorpayPaymentId = paymentId;
      user.subscriptionStartDate = new Date();
      user.subscriptionExpiryDate = expiryDate;
      await user.save();
    }

    res.json(successResponse('Payment verified and subscription activated', {
      subscriptionId: subscription._id,
      status: subscription.status,
      expiryDate: subscription.expiryDate
    }));
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json(errorResponse('Failed to verify payment'));
  }
});

// ===== GET SUBSCRIPTION STATUS =====
router.get('/subscription-status', verifyAuth, async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    
    const subscription = await Subscription.findOne({ userId });
    const user = await User.findById(userId).select('isSubscribed subscriptionStatus subscriptionPlan subscriptionExpiryDate');

    res.json(successResponse('Subscription status retrieved', {
      subscription: subscription || null,
      user: user || null,
      isActive: subscription?.status === 'active' && new Date() < subscription.expiryDate
    }));
  } catch (err) {
    console.error('Error getting subscription status:', err);
    res.status(500).json(errorResponse('Failed to get subscription status'));
  }
});

export default router;
