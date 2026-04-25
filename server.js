import express from 'express';
import cors from 'cors';
import http from 'http';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ===== LOAD ENVIRONMENT VARIABLES FIRST =====
import './init-env.js';

import { Server as SocketIOServer } from 'socket.io';
import connectDB from './config/database.js';
import { globalErrorHandler, notFoundHandler, jsonErrorHandler } from './utils/errorHandler.js';
import { getDbReconnectState, markDbReconnectStart, markDbReconnectEnd } from './utils/dbState.js';

// Import routes
import authRoutes from './routes/auth.js';
import configRoutes from './routes/config.js';
import subscriptionRoutes from './routes/subscriptions.js';
import razorpayRoutes from './routes/razorpay.js';
import adminRoutes from './routes/admin.js';
import cmsRoutes from './routes/cms.js';
import chatRoutes from './routes/chat.js';
import likesRoutes from './routes/likes.js';
import connectionRoutes from './routes/connections.js';
import discoveryRoutes from './routes/discovery.js';
import safetyRoutes from './routes/safety.js';
import profileAccessRoutes from './routes/profileAccess.js';
import registerChatSocket from './socket/chatSocket.js';
import { registerNotificationSocket } from './socket/notificationSocket.js';

// ===== VALIDATE ENVIRONMENT VARIABLES =====
const validateEnvVars = () => {
  const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.warn('⚠️ Missing environment variables:', missingVars.join(', '));
    console.warn('⚠️ Some features may not work without these variables');
  }

  if (process.env.FIREBASE_PRIVATE_KEY === 'YOUR_KEY_HERE') {
    console.warn('⚠️ FIREBASE_PRIVATE_KEY still has placeholder value - Firebase auth disabled');
  }

  if (
    process.env.JWT_SECRET === 'your-secret-key' ||
    process.env.JWT_SECRET === 'dev-secret'
  ) {
    console.warn('⚠️ JWT_SECRET using weak default - change in production!');
  }
};

validateEnvVars();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;

const normalizeOrigin = (origin) => {
  if (!origin || typeof origin !== 'string') return '';
  const trimmed = origin.trim();

  try {
    const parsed = new URL(trimmed);
    return `${parsed.protocol}//${parsed.host}`.toLowerCase();
  } catch {
    return trimmed.replace(/\/+$/, '').toLowerCase();
  }
};

const parseOriginList = (rawValue) => {
  if (!rawValue || typeof rawValue !== 'string') return [];

  return rawValue
    .split(',')
    .map((entry) => normalizeOrigin(entry))
    .filter(Boolean);
};

const isAllowedOrigin = (origin, allowedOriginSet) => {
  if (!origin) return true;

  const normalized = normalizeOrigin(origin);
  if (allowedOriginSet.has(normalized)) return true;

  let parsed;
  try {
    parsed = new URL(normalized);
  } catch {
    return false;
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) return false;

  const hostname = parsed.hostname.toLowerCase();
  const isLocalDevHost = /^(localhost|127\.0\.0\.1)$/.test(hostname);
  const isNetlify = hostname.endsWith('.netlify.app');
  const isVercel = hostname.endsWith('.vercel.app');
  const isRender = hostname.endsWith('.onrender.com');

  return isLocalDevHost || isNetlify || isVercel || isRender;
};

// ===== CONNECT DATABASE =====
connectDB().catch((err) => {
  console.error('⚠️ Database connection failed:', err.message);
  console.warn('⚠️ Server will still start, but database features will not work');
  console.warn('⚠️ Set proper MONGODB_URI environment variable on Render');
});

// ===== MIDDLEWARE =====
const staticAllowedOrigins = [
  // Local development
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5179',
  'http://localhost:5180',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:5176',
  'http://127.0.0.1:5177',
  'http://127.0.0.1:5178',
  'http://127.0.0.1:5179',
  'http://127.0.0.1:5180',

  // Production
  process.env.FRONTEND_URL,
  process.env.FRONTEND_PUBLIC_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  process.env.NETLIFY_URL,
  'https://seeu-daters-found.netlify.app',
  'https://www.seeu-daters-found.netlify.app',
  'https://seeu-daters.vercel.app',
  'https://www.seeu-daters.vercel.app',

  // Backend URL
  process.env.BACKEND_URL,
  'https://datee.onrender.com',
]
  .filter(Boolean)
  .map((origin) => normalizeOrigin(origin));

const envAllowedOrigins = [
  ...parseOriginList(process.env.CORS_ORIGIN),
  ...parseOriginList(process.env.CORS_ALLOWED_ORIGINS),
];

const allowedOriginSet = new Set([...staticAllowedOrigins, ...envAllowedOrigins]);

console.log('✅ Allowed CORS Origins:', Array.from(allowedOriginSet));

const makeCorsError = (origin) => {
  const error = new Error('Not allowed by CORS');
  error.statusCode = 403;

  if (process.env.NODE_ENV === 'development') {
    error.message = `Not allowed by CORS: ${origin}`;
  }

  return error;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin, allowedOriginSet)) {
      return callback(null, true);
    }

    console.warn('⚠️ CORS blocked origin:', origin);
    return callback(makeCorsError(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-pin'],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(jsonErrorHandler);

// Guard API routes when DB is unavailable
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  const { reconnectInProgress, lastReconnectAttempt } = getDbReconnectState();
  const shouldAttemptReconnect =
    !reconnectInProgress && Date.now() - lastReconnectAttempt > 10000;

  if (shouldAttemptReconnect) {
    markDbReconnectStart();

    connectDB()
      .then(() => {
        console.log('✅ [DB] Background reconnect successful');
      })
      .catch((error) => {
        console.warn(`⚠️ [DB] Background reconnect failed: ${error?.message || 'unknown error'}`);
      })
      .finally(() => {
        markDbReconnectEnd();
      });
  }

  return res.status(503).json({
    success: false,
    message: 'Database unavailable. Please try again in a moment.',
  });
});

// ===== STATIC FILES =====
const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✓ Created uploads directory');
}

app.use('/uploads', express.static(uploadDir));

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend server is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ===== ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/razorpay', razorpayRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/profile-access', profileAccessRoutes);

// ===== ROOT ROUTE =====
app.get('/', (req, res) => {
  res.json({
    message: 'SeeU-Daters Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      subscriptions: '/api/subscriptions',
      admin: '/api/admin',
      chat: '/api/chat',
      likes: '/api/likes',
      connections: '/api/connections',
    },
  });
});

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin, allowedOriginSet)) {
        return callback(null, true);
      }

      return callback(makeCorsError(origin));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

registerChatSocket(io);
registerNotificationSocket(io);

// Attach io to app for use in routes
app.locals.io = io;

// ===== ERROR HANDLING =====
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ===== START SERVER =====
httpServer.on('error', (error) => {
  if (error?.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. A backend instance is likely already running.`);
    console.error('✅ If the site works, keep using the existing server process.');
    process.exit(1);
  }

  console.error('❌ Server startup error:', error.message);
  process.exit(1);
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 SeeU-Daters Backend Server`);
  console.log(`${'='.repeat(50)}`);
  console.log(`✓ Server running on http://0.0.0.0:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV}`);
  console.log(`✓ Database URL: ${process.env.MONGODB_URI ? '✅ Set' : '❌ NOT SET'}`);
  console.log(`✓ Socket.io: enabled`);
  console.log(`✓ Public URL: https://datee.onrender.com`);
  console.log(`${'='.repeat(50)}\n`);
});

export default app;