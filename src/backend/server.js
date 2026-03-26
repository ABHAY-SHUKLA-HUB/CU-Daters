// src/backend/server.js
/**
 * SeeU-Daters - Subscription System Backend Server
 * 
 * Main entry point for the backend API server
 * Start with: npm run server
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const admin = require('firebase-admin');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import routes
const subscriptionRoutes = require('./routes/subscriptionRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ============ MIDDLEWARE ============

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging
app.use(morgan('combined'));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests, please try again later'
});
app.use(globalLimiter);

// ============ DATABASE CONNECTION ============

async function connectDatabase() {
  try {
    console.log('📡 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });

    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

// ============ FIREBASE INITIALIZATION ============

async function initializeFirebase() {
  try {
    console.log('🔐 Initializing Firebase...');

    // Load Firebase credentials from environment
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });

    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('⚠️  Firebase initialization optional:', error.message);
    // Don't exit - Firebase is optional for development
  }
}

// ============ HEALTH CHECK ============

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============ API ROUTES ============

// Subscription routes (user and admin)
app.use('/api', subscriptionRoutes);

// ============ ERROR HANDLING ============

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'not_found',
    message: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error('❌ Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'validation_error',
      message: err.message,
      details: Object.values(err.errors).map(e => e.message)
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      error: 'duplicate_entry',
      message: `${field} already exists`
    });
  }

  // Generic error
  res.status(500).json({
    error: 'internal_error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error'
      : err.message
  });
});

// ============ SERVER STARTUP ============

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Initialize Firebase
    await initializeFirebase();

    // Start server
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════╗
║   SeeU-Daters Backend Server        ║
║   Subscription System API              ║
╚════════════════════════════════════════╝

🚀 Server running on http://localhost:${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📡 Database: Connected
🔐 Authentication: Firebase
☁️  Storage: AWS S3

📚 API Routes:
  - POST   /api/v1/subscription/create-request
  - GET    /api/v1/subscription/status
  - POST   /api/v1/subscription/upload-proof
  - GET    /api/v1/subscription/details/:request_id
  - POST   /api/v1/subscription/retry

👨‍💼 Admin Routes:
  - GET    /admin/subscription/requests
  - GET    /admin/subscription/requests/:request_id
  - POST   /admin/subscription/approve
  - POST   /admin/subscription/reject
  - GET    /admin/subscription/stats
  - GET    /admin/subscription/audit-logs

📖 API Documentation: http://localhost:${PORT}/api/docs
🏥 Health Check: http://localhost:${PORT}/health

✨ Ready to accept requests!
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// ============ GRACEFUL SHUTDOWN ============

process.on('SIGTERM', async () => {
  console.log('\n⛔ SIGTERM signal received: closing HTTP server');
  
  await mongoose.disconnect();
  console.log('MongoDB connection closed');
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n⛔ SIGINT signal received: closing HTTP server');
  
  await mongoose.disconnect();
  console.log('MongoDB connection closed');
  
  process.exit(0);
});

// ============ START SERVER ============

startServer();

module.exports = app;

