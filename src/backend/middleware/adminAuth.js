// src/backend/middleware/adminAuth.js
/**
 * Admin Authentication Middleware
 * Verifies JWT tokens and checks admin role
 */

const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');

const adminAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided. Please login.' });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    );

    // Fetch user and check admin role
    const user = await UserModel.findById(decoded.id || decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return res.status(403).json({ message: 'You do not have admin access' });
    }

    // Attach user info to request
    req.user = decoded;
    req.user.role = user.role;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }

    res.status(401).json({ message: 'Invalid token or unauthorized' });
  }
};

module.exports = adminAuth;
