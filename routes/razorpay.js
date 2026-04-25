import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import { verifyAuth } from '../utils/auth.js';
import { successResponse, errorResponse } from '../utils/validation.js';

// Force reload - Razorpay payment debugging
const router = express.Router();

// ===== INITIALIZE RAZORPAY =====
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ===== VERIFY RAZORPAY CREDENTIALS =====
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error('❌ RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set in .env');
} else {
  console.log('✅ Razorpay initialized (Test Mode)');
}

/**
 * POST /api/razorpay/order
 * Create a Razorpay order for payment
 * 
 * Body:
 * - amount: number (in INR, will be converted to paise)
 * - plan: string (plan name)
 * - duration: number (days)
 */
router.post('/order', verifyAuth, async (req, res) => {
  try {
    const { amount, plan, duration } = req.body;
    const userId = req.userId;
    const user = req.user;

    // Validate inputs
    if (!amount || amount <= 0) {
      return res.status(400).json(errorResponse('Invalid amount'));
    }
    if (!plan) {
      return res.status(400).json(errorResponse('Plan name is required'));
    }

    // Validate user
    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    if (!user.email || !user.name) {
      console.error(`❌ User missing required fields - Email: ${user.email}, Name: ${user.name}`);
      return res.status(400).json(errorResponse('User profile incomplete'));
    }

    // Amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(amount * 100);

    console.log(`💰 Creating order for user ${userId}, amount: ₹${amount}`);

    // Create Razorpay order
    // Receipt must be max 40 chars - use timestamp only
    const receipt = `ORD${Date.now()}`.substring(0, 40);
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: receipt,
      payment_capture: 1, // Auto-capture payment
      notes: {
        userId: userId.toString(),
        plan,
        duration,
        userEmail: user.email,
        userName: user.name,
      },
    };

    console.log(`📦 Razorpay order options:`, options);
    let order;
    try {
      order = await razorpay.orders.create(options);
      console.log(`✅ Razorpay order created successfully:`, order.id);
    } catch (rzError) {
      // Log detailed error information
      console.error('\n❌ ===== RAZORPAY ERROR =====');
      console.error('Error Object:', rzError);
      console.error('Error Type:', typeof rzError);
      console.error('Error Name:', rzError?.name);
      console.error('Error Message:', rzError?.message);
      console.error('Error Code:', rzError?.code);
      console.error('Error StatusCode:', rzError?.statusCode);
      console.error('Error Description:', rzError?.description);
      console.error('===========================\n');
      throw new Error(rzError?.message || rzError?.description || 'Razorpay API Error');
    }

    console.log(`✅ Razorpay order created: ${order.id} for user ${userId}`);

    return res.json(successResponse('Order created successfully', {
      orderId: order.id,
      amount: amount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      userEmail: user.email,
      userName: user.name,
      planId: plan,
      notes: {
        plan,
        duration,
      },
    }));
  } catch (error) {
    console.error('❌ Error creating Razorpay order:');
    console.error('   Full Error:', JSON.stringify(error, null, 2));
    console.error('   Error.message:', error?.message);
    console.error('   Error.code:', error?.code);
    console.error('   Error.statusCode:', error?.statusCode);
    console.error('   Error.response:', error?.response);
    return res.status(500).json(errorResponse(error?.message || error?.toString() || 'Failed to create order'));
  }
});

/**
 * POST /api/razorpay/verify
 * Verify payment signature and update subscription
 * 
 * Body:
 * - razorpay_payment_id: string
 * - razorpay_order_id: string
 * - razorpay_signature: string
 * - plan: string
 * - amount: number
 * - duration: number
 */
router.post('/verify', verifyAuth, async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      plan,
      amount,
      duration,
    } = req.body;

    const userId = req.userId;
    const user = req.user;

    // Validate inputs
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json(errorResponse('Missing payment details'));
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.warn(`⚠️ Invalid signature for payment ${razorpay_payment_id}`);
      return res.status(400).json(errorResponse('Invalid payment signature'));
    }

    console.log(`✅ Payment signature verified: ${razorpay_payment_id}`);

    // Validate user
    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    // Calculate subscription dates
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (duration || 30));

    // Check for duplicate payment
    const existingPayment = await Subscription.findOne({
      payment_id: razorpay_payment_id,
    });

    if (existingPayment) {
      console.warn(`⚠️ Duplicate payment detected: ${razorpay_payment_id}`);
      return res.status(400).json(errorResponse('Payment already processed'));
    }

    // Create subscription record
    const subscription = new Subscription({
      user_id: userId,
      plan: plan || 'Premium',
      amount: amount,
      payment_id: razorpay_payment_id,
      status: 'active',
      start_date: startDate,
      expiry_date: expiryDate,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await subscription.save();

    // Update user subscription status
    user.subscription_status = 'active';
    user.subscription_expiry_date = expiryDate;
    user.lastSubscriptionId = subscription._id;
    await user.save();

    console.log(`✅ Subscription activated for user ${userId}, expires ${expiryDate}`);

    return res.json(successResponse('Payment verified and subscription activated', {
      subscriptionId: subscription._id,
      paymentId: razorpay_payment_id,
      status: 'active',
      expiryDate: expiryDate,
    }));
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    return res.status(500).json(errorResponse(error.message || 'Failed to verify payment'));
  }
});

/**
 * GET /api/razorpay/key
 * Get public key for frontend (Key ID only - safe to expose)
 */
router.get('/key', (req, res) => {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) {
      return res.status(500).json(errorResponse('Razorpay key not configured'));
    }

    return res.json(successResponse('Razorpay key retrieved', {
      keyId: keyId,
    }));
  } catch (error) {
    console.error('❌ Error getting Razorpay key:', error);
    return res.status(500).json(errorResponse('Failed to get key'));
  }
});

export default router;
