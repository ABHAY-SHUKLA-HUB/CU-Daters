import express from 'express';
import SupportTicket from '../models/SupportTicket.js';
import SupportMessage from '../models/SupportMessage.js';
import SupportCategory from '../models/SupportCategory.js';
import User from '../models/User.js';
import { verifyFirebaseOrJwtAuth } from '../middleware/authFirebaseOrJwt.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { successResponse, errorResponse } from '../utils/validation.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for support request creation
const supportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many support requests created, please try again later'
});

// ===== GET SUPPORT CATEGORIES =====
router.get(
  '/categories',
  asyncHandler(async (req, res) => {
    const categories = await SupportCategory.find({ active: true })
      .sort({ order: 1 })
      .lean();

    res.json(successResponse('Support categories fetched', { categories }));
  })
);

// ===== CREATE SUPPORT REQUEST =====
router.post(
  '/request',
  verifyFirebaseOrJwtAuth,
  supportLimiter,
  asyncHandler(async (req, res) => {
    const { category, message } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!category || !message) {
      return res.status(400).json(errorResponse('Category and message are required'));
    }

    if (typeof message !== 'string' || message.trim().length < 3 || message.trim().length > 1000) {
      return res.status(400).json(errorResponse('Message must be between 3 and 1000 characters'));
    }

    // Check if category exists
    const categoryExists = await SupportCategory.findOne({ name: category, active: true });
    if (!categoryExists) {
      return res.status(400).json(errorResponse('Invalid support category'));
    }

    // Check if user has an active support request
    const activeRequest = await SupportTicket.findOne({
      user_id: userId,
      status: { $in: ['pending', 'accepted'] }
    });

    if (activeRequest) {
      return res.status(400).json(errorResponse('You already have an active support request'));
    }

    // Create support request
    const supportTicket = await SupportTicket.create({
      user_id: userId,
      category: category,
      subject: `${category} - Support Request`,
      description: message.trim(),
      status: 'pending',
      created_at: new Date()
    });

    // Create initial message from user
    await SupportMessage.create({
      support_ticket_id: supportTicket._id,
      sender_id: userId,
      sender_type: 'user',
      message: message.trim()
    });

    res.status(201).json(successResponse('Support request created', {
      request_id: supportTicket._id,
      status: supportTicket.status,
      category: supportTicket.category,
      created_at: supportTicket.created_at
    }));
  })
);

// ===== GET MY SUPPORT REQUESTS =====
router.get(
  '/my-requests',
  verifyFirebaseOrJwtAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const requests = await SupportTicket.find({ user_id: userId })
      .sort({ created_at: -1 })
      .lean();

    const requestIds = requests.map(r => r._id);
    const messages = await SupportMessage.find({ support_ticket_id: { $in: requestIds } })
      .sort({ created_at: 1 })
      .lean();

    const messagesByTicket = new Map();
    messages.forEach(msg => {
      const key = msg.support_ticket_id.toString();
      if (!messagesByTicket.has(key)) {
        messagesByTicket.set(key, []);
      }
      messagesByTicket.get(key).push(msg);
    });

    const enrichedRequests = requests.map(req => ({
      ...req,
      messages: messagesByTicket.get(req._id.toString()) || []
    }));

    res.json(successResponse('Support requests fetched', { requests: enrichedRequests }));
  })
);

// ===== GET SINGLE SUPPORT REQUEST =====
router.get(
  '/request/:requestId',
  verifyFirebaseOrJwtAuth,
  asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const userId = req.user._id;

    const supportTicket = await SupportTicket.findById(requestId)
      .populate('user_id', 'name email')
      .populate('admin_id', 'name email');

    if (!supportTicket) {
      return res.status(404).json(errorResponse('Support request not found'));
    }

    // Check authorization
    if (supportTicket.user_id._id.toString() !== userId.toString()) {
      return res.status(403).json(errorResponse('Unauthorized'));
    }

    const messages = await SupportMessage.find({ support_ticket_id: requestId })
      .sort({ created_at: 1 })
      .lean();

    res.json(successResponse('Support request fetched', {
      request: supportTicket,
      messages
    }));
  })
);

// ===== SEND MESSAGE IN SUPPORT REQUEST =====
router.post(
  '/request/:requestId/message',
  verifyFirebaseOrJwtAuth,
  asyncHandler(async (req, res) => {
    const { requestId } = req.params;
    const { message } = req.body;
    const userId = req.user._id;

    if (!message || typeof message !== 'string' || message.trim().length === 0 || message.trim().length > 2000) {
      return res.status(400).json(errorResponse('Message must be between 1 and 2000 characters'));
    }

    const supportTicket = await SupportTicket.findById(requestId);
    if (!supportTicket) {
      return res.status(404).json(errorResponse('Support request not found'));
    }

    // Check authorization and status
    if (supportTicket.user_id.toString() !== userId.toString()) {
      return res.status(403).json(errorResponse('Unauthorized'));
    }

    if (supportTicket.status !== 'accepted') {
      return res.status(400).json(errorResponse('Support request is not active'));
    }

    const supportMessage = await SupportMessage.create({
      support_ticket_id: requestId,
      sender_id: userId,
      sender_type: 'user',
      message: message.trim()
    });

    // Update ticket's updated_at
    supportTicket.updated_at = new Date();
    await supportTicket.save();

    res.status(201).json(successResponse('Message sent', {
      message: supportMessage
    }));
  })
);

export default router;
