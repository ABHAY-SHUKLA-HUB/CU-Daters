import express from 'express';
import { randomBytes, createHmac, timingSafeEqual } from 'crypto';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import VerificationSubmission from '../models/VerificationSubmission.js';
import { generateToken, logActivity, getClientInfo } from '../utils/auth.js';
import { verifyFirebaseOrJwtAuth } from '../middleware/authFirebaseOrJwt.js';
import { asyncHandler, AppError } from '../utils/errorHandler.js';
import {
  validateEmail,
  validatePhone,
  validatePassword,
  sanitizeUser,
  errorResponse,
  successResponse
} from '../utils/validation.js';
import { sendOtpEmail, sendPasswordResetEmail, sendRegistrationConfirmationEmail, getEmailServiceHealth } from '../utils/emailService.js';
import { createAdminSession, setAdminAuthCookies } from '../services/securityService.js';
import { saveVerificationMediaFromDataUrl } from '../utils/verificationStorage.js';

const ADMIN_ROLES = ['admin', 'super_admin', 'moderator', 'finance_admin', 'support_admin', 'analyst'];
const SMTP_ALERT_FAILURE_THRESHOLD = Math.max(2, Number(process.env.SMTP_ALERT_FAILURE_THRESHOLD || 3));
const OTP_EXPIRY_SECONDS = Math.max(60, Number(process.env.OTP_EXPIRY_SECONDS || 300));
const OTP_VERIFY_MAX_ATTEMPTS = Math.max(3, Number(process.env.OTP_VERIFY_MAX_ATTEMPTS || 5));
const OTP_VERIFY_LOCK_MINUTES = Math.max(5, Number(process.env.OTP_VERIFY_LOCK_MINUTES || 15));
const OTP_HASH_SECRET = String(process.env.OTP_HASH_SECRET || process.env.JWT_SECRET || 'otp-default-secret').trim();

const router = express.Router();

const otpRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 12 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests. Please wait and try again.'
  }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.'
  }
});

const hashOtp = (otp, email) => createHmac('sha256', OTP_HASH_SECRET)
  .update(`${String(email || '').toLowerCase().trim()}::${String(otp || '').trim()}`)
  .digest('hex');

const safeOtpMatch = (user, otpInput, emailLower) => {
  if (!user?.emailOtp || !otpInput) return false;
  const incomingHash = hashOtp(otpInput, emailLower);
  const storedOtp = String(user.emailOtp || '');

  // Backward compatibility for previously stored plain-text OTP values.
  if (/^\d{6}$/.test(storedOtp)) {
    return storedOtp === String(otpInput);
  }

  try {
    return timingSafeEqual(Buffer.from(storedOtp, 'hex'), Buffer.from(incomingHash, 'hex'));
  } catch {
    return storedOtp === incomingHash;
  }
};

const ONBOARDING_FIELD_SUGGESTIONS = [
  'Software Engineering',
  'Product Design',
  'Data Science',
  'Marketing',
  'Finance',
  'Consulting',
  'Content Creation',
  'Sales',
  'Human Resources',
  'Operations',
  'Law',
  'Healthcare',
  'Research',
  'Education',
  'Entrepreneurship'
];

const normalizeFieldOfWork = (value) => {
  const compact = String(value || '')
    .replace(/[^a-zA-Z0-9&/\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!compact) return '';
  return compact
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .slice(0, 80);
};

const parseExperienceYears = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 40) {
    return NaN;
  }
  return Math.trunc(parsed);
};

const normalizeIdProofType = (value) => {
  const allowed = new Set(['government_id', 'employee_id', 'student_id', 'other']);
  const normalized = String(value || 'government_id').trim().toLowerCase();
  return allowed.has(normalized) ? normalized : 'government_id';
};

// ===== EMAIL SERVICE HEALTH =====
router.get('/email-health', asyncHandler(async (req, res) => {
  const adminPin = String(process.env.ADMIN_PIN || '').trim();
  const providedPin = String(req.headers['x-admin-pin'] || req.query.adminPin || '').trim();
  const canAccessWithoutPin = process.env.NODE_ENV !== 'production';

  if (!canAccessWithoutPin && adminPin && providedPin !== adminPin) {
    return res.status(403).json(
      errorResponse('Forbidden', {
        code: 'EMAIL_HEALTH_FORBIDDEN'
      })
    );
  }

  const health = getEmailServiceHealth();
  const httpStatus = health.degraded ? 503 : 200;

  return res.status(httpStatus).json(
    successResponse('Email service health status', {
      code: health.degraded ? 'EMAIL_SERVICE_DEGRADED' : 'EMAIL_SERVICE_OK',
      ...health
    })
  );
}));

router.get('/onboarding/field-suggestions', asyncHandler(async (req, res) => {
  const query = String(req.query.q || '').trim().toLowerCase();
  const baseList = ONBOARDING_FIELD_SUGGESTIONS;
  const data = query
    ? baseList.filter((item) => item.toLowerCase().includes(query)).slice(0, 8)
    : baseList.slice(0, 8);

  return res.json(successResponse('Field suggestions fetched', { suggestions: data }));
}));

// ===== EMAIL SERVICE HEALTH CHECK =====
router.get('/email-health', (req, res) => {
  const health = getEmailServiceHealth();
  res.json({
    status: 'ok',
    email: health,
  });
});

// ===== SEND OTP (Email) =====
router.post('/send-otp', otpRequestLimiter, asyncHandler(async (req, res, _next) => {
  console.log('\n========== SEND OTP REQUEST ==========');
  
  const { email, name, phone, password, college } = req.body;

  // Debug logging
  console.log('Password received:', password);
  console.log('Password type:', typeof password);
  console.log('Password length:', password?.length);
  console.log('validatePassword result:', validatePassword(password));

  // Validation
  if (!email || !validateEmail(email)) {
    throw new AppError('Valid email address is required', 400);
  }

  if (!password || !validatePassword(password)) {
    console.log('Password validation failed!');
    console.log('  Has Upper:', /[A-Z]/.test(password));
    console.log('  Has Lower:', /[a-z]/.test(password));
    console.log('  Has Digit:', /[0-9]/.test(password));
    throw new AppError('Password must be at least 8 characters with uppercase, lowercase, and number', 400);
  }

  if (!name || name.trim().length < 2) {
    throw new AppError('Name is required', 400);
  }

  if (!phone || !validatePhone(phone)) {
    throw new AppError('Valid 10-digit phone number is required', 400);
  }

  if (!college) {
    throw new AppError('College selection is required', 400);
  }

  const emailLower = email.toLowerCase().trim();

  // Only check if email is APPROVED/ACTIVE (admin approved)
  // Allow if: pending, rejected, needs_correction (user can retry)
  const existingApprovedUser = await User.findOne({
    $or: [
      { email: emailLower },
      { collegeEmail: emailLower },
      { personalEmail: emailLower }
    ],
    status: { $in: ['approved', 'active'] }, // Only these statuses block registration
    profile_approval_status: { $in: ['approved', 'active'] }
  });

  if (existingApprovedUser) {
    throw new AppError('Email already registered. Please login instead.', 409);
  }

  // Check if phone already registered (only if approved/active)
  if (phone) {
    const phoneUser = await User.findOne({ 
      phone,
      status: { $in: ['approved', 'active'] }
    });
    if (phoneUser) {
      throw new AppError('This phone number is already registered with an active account. Please use a different phone number.', 409);
    }
  }

  // Get existing temp user (allow resends during signup) using all email identity fields.
  let tempUser = await User.findOne({
    $and: [
      {
        $or: [
          { email: emailLower },
          { collegeEmail: emailLower },
          { personalEmail: emailLower }
        ]
      },
      {
        $or: [
          { status: 'pending' },
          { profile_approval_status: { $in: ['pending', 'rejected', 'needs_correction'] } }
        ]
      }
    ]
  });

  // Check OTP request limit (max 5 requests in 20 minutes)
  const MAX_OTP_REQUESTS = 5;
  const COOLDOWN_MINUTES = 20;
  const now = new Date();
  const wasExistingTempUser = Boolean(tempUser);
  const previousOtpRequestCount = Number(tempUser?.otpRequestCount || 0);
  const previousOtpRequestLastTime = tempUser?.otpRequestLastTime || null;
  const previousOtpCooldownUntil = tempUser?.otpCooldownUntil || null;
  const previousEmailOtp = tempUser?.emailOtp || null;
  const previousEmailOtpExpiry = tempUser?.emailOtpExpiry || null;

  if (tempUser) {
    // Check if user is in cooldown period
    if (tempUser.otpCooldownUntil && now < tempUser.otpCooldownUntil) {
      const minutesRemaining = Math.ceil((tempUser.otpCooldownUntil - now) / 60000);
      throw new AppError(
        `You have reached your OTP limit. Please try again after ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}.`,
        429
      );
    }

    // Reset count if cooldown has expired
    if (tempUser.otpCooldownUntil && now >= tempUser.otpCooldownUntil) {
      tempUser.otpRequestCount = 0;
      tempUser.otpCooldownUntil = null;
    }

    // Check if request count exceeded
    if (tempUser.otpRequestCount >= MAX_OTP_REQUESTS) {
      tempUser.otpCooldownUntil = new Date(now.getTime() + COOLDOWN_MINUTES * 60 * 1000);
      await tempUser.save();
      throw new AppError(
        `You have reached your OTP limit. Please try again after ${COOLDOWN_MINUTES} minutes.`,
        429
      );
    }

    // Increment request count
    tempUser.otpRequestCount += 1;
    tempUser.otpRequestLastTime = now;
  }

  // Generate OTP (6 digits)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);
  const otpHash = hashOtp(otp, emailLower);

  // Store OTP temporarily in database FIRST
  if (!tempUser) {
    tempUser = new User({
      name: name.trim(),
      email: emailLower,
      personalEmail: emailLower,
      collegeEmail: emailLower,
      phone,
      password,
      college,
      emailOtp: otpHash,
      emailOtpExpiry: otpExpiry,
      otpVerifyAttempts: 0,
      otpLockedUntil: null,
      otpRequestCount: 1,
      otpRequestLastTime: now,
      status: 'pending',
      role: 'user',
      subscription_status: 'none'
    });
  } else {
    // Keep all identity email fields in sync so verify/signup can always find the same record.
    tempUser.name = tempUser.name || name.trim();
    tempUser.email = emailLower;
    tempUser.personalEmail = emailLower;
    tempUser.collegeEmail = emailLower;
    tempUser.phone = tempUser.phone || phone;
    tempUser.college = tempUser.college || college;
    tempUser.emailOtp = otpHash;
    tempUser.emailOtpExpiry = otpExpiry;
    tempUser.otpVerifyAttempts = 0;
    tempUser.otpLockedUntil = null;
    if (!tempUser.otpRequestCount) {
      tempUser.otpRequestCount = 1;
    }
    tempUser.otpRequestLastTime = now;
  }

  try {
    await tempUser.save();
  } catch (saveError) {
    // Recover gracefully if a concurrent request created user first.
    if (saveError?.code === 11000) {
      tempUser = await User.findOne({
        $or: [
          { email: emailLower },
          { collegeEmail: emailLower },
          { personalEmail: emailLower },
          ...(phone ? [{ phone }] : [])
        ]
      });

      if (!tempUser) {
        throw saveError;
      }

      tempUser.emailOtp = otpHash;
      tempUser.emailOtpExpiry = otpExpiry;
      tempUser.otpVerifyAttempts = 0;
      tempUser.otpLockedUntil = null;
      tempUser.otpRequestCount = Math.max(1, Number(tempUser.otpRequestCount || 0));
      tempUser.otpRequestLastTime = now;
      await tempUser.save();
    } else {
      throw saveError;
    }
  }

  // Show remaining attempts
  const remainingAttempts = MAX_OTP_REQUESTS - tempUser.otpRequestCount;

  // IMPORTANT: Respond immediately - send email in background
  res.status(200).json(
    successResponse('OTP sent successfully to your email. Valid for 5 minutes.', {
      code: 'OTP_SENT',
      email: emailLower,
      expiresIn: OTP_EXPIRY_SECONDS,
      resendAfterSeconds: 30,
      otpRequestsRemaining: remainingAttempts,
      maxRequests: MAX_OTP_REQUESTS,
      emailStatus: 'queued'
    })
  );

  // Send OTP email in background (don't wait for it)
  setImmediate(async () => {
    try {
      // Add timeout to email sending (10 seconds max for background task)
      const emailPromise = sendOtpEmail(emailLower, otp);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email service timeout (10s)')), 10000)
      );
      
      await Promise.race([emailPromise, timeoutPromise]);
      console.log(`✅ OTP email sent successfully to ${emailLower}`);
    } catch (emailErr) {
      const emailError = emailErr.message;
      console.error(`❌ OTP EMAIL FAILED for ${emailLower}:`, emailError);
      console.error('Email Error Details:', emailErr);

      // Try to log activity if DB is available
      try {
        const health = getEmailServiceHealth();
        const isRepeatedFailure = Number(health?.counters?.consecutiveFailures || 0) >= SMTP_ALERT_FAILURE_THRESHOLD;

        await logActivity({
          user_id: tempUser?._id,
          action: isRepeatedFailure ? 'otp_email_failed_repeated' : 'otp_email_failed',
          description: isRepeatedFailure
            ? `Repeated OTP email failures detected (${health.counters.consecutiveFailures} consecutive failures)`
            : 'OTP email delivery failed',
          ...getClientInfo(req),
          status: 'failure',
          error_message: emailError,
          metadata: {
            email: emailLower,
            emailService: {
              degraded: Boolean(health?.degraded),
              consecutiveFailures: Number(health?.counters?.consecutiveFailures || 0),
              lastErrorCode: health?.lastErrorCode || null,
              lastFailureAt: health?.lastFailureAt || null
            }
          }
        });

        if (isRepeatedFailure) {
          console.error(`🚨 SMTP ALERT: ${health.counters.consecutiveFailures} consecutive email failures detected.`);
        }
      } catch (activityError) {
        console.error('⚠️ Failed to log OTP email failure activity:', activityError?.message || activityError);
      }
    }
  });
}));

// Old code (kept for reference - commented out)
/*
  // Show remaining attempts
  const remainingAttempts = MAX_OTP_REQUESTS - tempUser.otpRequestCount;

  // Send OTP email (important - wait for result to check errors)
  let emailSent = false;
  let emailError = null;
  
  try {
    // Add timeout to email sending (20 seconds max)
    const emailPromise = sendOtpEmail(emailLower, otp);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email service timeout (20s)')), 20000)
    );
    
    await Promise.race([emailPromise, timeoutPromise]);
    emailSent = true;
    console.log(`✅ OTP email sent successfully to ${emailLower}`);
  } catch (emailErr) {
    emailError = emailErr.message;
    console.error(`❌ OTP EMAIL FAILED for ${emailLower}:`, emailErr.message);
    console.error('Email Error Details:', emailErr);
  }

  // IMPORTANT: Respond to user with email status
  if (emailSent) {
    res.status(200).json(
      successResponse('OTP sent successfully to your email. Valid for 5 minutes.', {
        code: 'OTP_SENT',
        email: emailLower,
        expiresIn: OTP_EXPIRY_SECONDS,
        resendAfterSeconds: 30,
        otpRequestsRemaining: remainingAttempts,
        maxRequests: MAX_OTP_REQUESTS,
        emailStatus: 'sent'
      })
    );
  } else {
    // Never expose OTP via API response.
    console.error(`❌ OTP email delivery failed for ${emailLower}: ${emailError}`);

    try {
      if (wasExistingTempUser) {
        // Restore rate-limit and OTP state so failed SMTP attempts do not punish users.
        tempUser.otpRequestCount = previousOtpRequestCount;
        tempUser.otpRequestLastTime = previousOtpRequestLastTime;
        tempUser.otpCooldownUntil = previousOtpCooldownUntil;
        tempUser.emailOtp = previousEmailOtp;
        tempUser.emailOtpExpiry = previousEmailOtpExpiry;
      } else {
        // New signup that failed to send OTP should not consume quota or keep undelivered OTP.
        tempUser.otpRequestCount = 0;
        tempUser.otpRequestLastTime = null;
        tempUser.otpCooldownUntil = null;
        tempUser.emailOtp = null;
        tempUser.emailOtpExpiry = null;
      }
      await tempUser.save();
    } catch (rollbackError) {
      console.error('⚠️ Failed to rollback OTP counters after email failure:', rollbackError?.message || rollbackError);
    }

    try {
      const health = getEmailServiceHealth();
      const isRepeatedFailure = Number(health?.counters?.consecutiveFailures || 0) >= SMTP_ALERT_FAILURE_THRESHOLD;

      await logActivity({
        user_id: tempUser?._id,
        action: isRepeatedFailure ? 'otp_email_failed_repeated' : 'otp_email_failed',
        description: isRepeatedFailure
          ? `Repeated OTP email failures detected (${health.counters.consecutiveFailures} consecutive failures)`
          : 'OTP email delivery failed',
        ...getClientInfo(req),
        status: 'failure',
        error_message: emailError,
        metadata: {
          email: emailLower,
          otpRequestsRemaining: Math.max(0, remainingAttempts),
          emailService: {
            degraded: Boolean(health?.degraded),
            consecutiveFailures: Number(health?.counters?.consecutiveFailures || 0),
            lastErrorCode: health?.lastErrorCode || null,
            lastFailureAt: health?.lastFailureAt || null
          }
        }
      });

      if (isRepeatedFailure) {
        console.error(`🚨 SMTP ALERT: ${health.counters.consecutiveFailures} consecutive email failures detected.`);
      }
    } catch (activityError) {
      console.error('⚠️ Failed to log OTP email failure activity:', activityError?.message || activityError);
    }

    const errorText = String(emailError || '').toLowerCase();
    const isProviderAuthFailure =
      errorText.includes('authentication failed') ||
      errorText.includes('invalid login') ||
      errorText.includes(' 535') ||
      errorText.includes('eauth');

    const message = isProviderAuthFailure
      ? 'OTP email service is not configured correctly right now. Please contact support.'
      : 'Unable to send OTP email right now. Please try again in 1-2 minutes.';

    res.status(503).json(
      errorResponse(message, {
        code: isProviderAuthFailure ? 'OTP_EMAIL_PROVIDER_AUTH_FAILED' : 'OTP_EMAIL_DELIVERY_FAILED',
        retryAfterSeconds: isProviderAuthFailure ? 300 : 90,
        emailStatus: 'failed',
        temporary: !isProviderAuthFailure
      })
    );
  }
*/
router.post('/verify-otp', otpRequestLimiter, asyncHandler(async (req, res, _next) => {
  console.log('\n========== VERIFY OTP REQUEST ==========');
  
  const { email, otp } = req.body;

  // Validation
  if (!email || !validateEmail(email)) {
    throw new AppError('Valid email address is required', 400);
  }

  if (!otp || !/^\d{6}$/.test(String(otp))) {
    throw new AppError('Valid 6-digit OTP is required', 400);
  }

  const emailLower = email.toLowerCase().trim();

  // Find the same user regardless of which email field was previously populated.
  const user = await User.findOne({
    $or: [
      { email: emailLower },
      { collegeEmail: emailLower },
      { personalEmail: emailLower }
    ]
  });

  if (!user) {
    throw new AppError('User not found. Please sign up first.', 404);
  }

  const now = new Date();
  if (user.otpLockedUntil && now < user.otpLockedUntil) {
    const secondsLeft = Math.max(1, Math.ceil((new Date(user.otpLockedUntil).getTime() - now.getTime()) / 1000));
    throw new AppError(`Too many invalid OTP attempts. Try again in ${secondsLeft} seconds.`, 429);
  }

  if (!user.emailOtp || !user.emailOtpExpiry) {
    throw new AppError('No OTP found. Please request a new OTP.', 400);
  }

  // Check if OTP has expired
  if (new Date() > user.emailOtpExpiry) {
    user.emailOtp = null;
    user.emailOtpExpiry = null;
    user.otpVerifyAttempts = 0;
    user.otpLockedUntil = null;
    await user.save();
    throw new AppError('OTP has expired. Please request a new one.', 400);
  }

  // Check if OTP matches
  if (!safeOtpMatch(user, otp, emailLower)) {
    const nextAttempts = Number(user.otpVerifyAttempts || 0) + 1;
    user.otpVerifyAttempts = nextAttempts;

    if (nextAttempts >= OTP_VERIFY_MAX_ATTEMPTS) {
      user.otpLockedUntil = new Date(Date.now() + OTP_VERIFY_LOCK_MINUTES * 60 * 1000);
      await user.save();
      throw new AppError(`Too many invalid OTP attempts. Please request a new OTP or try again in ${OTP_VERIFY_LOCK_MINUTES} minutes.`, 429);
    }

    await user.save();
    throw new AppError(`Invalid OTP. ${OTP_VERIFY_MAX_ATTEMPTS - nextAttempts} attempt(s) remaining.`, 400);
  }

  // Mark email as verified
  user.emailVerified = true;
  user.emailOtp = null;
  user.emailOtpExpiry = null;
  user.otpVerifyAttempts = 0;
  user.otpLockedUntil = null;
  await user.save();

  console.log(`✅ Email verified for: ${emailLower}`);

  res.status(200).json(
    successResponse('Email verified successfully. Proceed with profile completion.', {
      email: emailLower,
      verified: true,
      nextStep: 'profile_info'
    })
  );
}));

// ===== SIGNUP (After OTP Verification) =====
router.post('/signup', asyncHandler(async (req, res, _next) => {
  console.log('\n========== SIGNUP REQUEST (Complete Profile) ==========');
  
  const {
    email,
    gender,
    course,
    year,
    fieldOfWork,
    experienceYears,
    bio,
    livePhoto,
    idCard,
    liveSelfie,
    idProofFile,
    idProofType
  } = req.body;

  const normalizedFieldOfWork = normalizeFieldOfWork(fieldOfWork || course);
  const normalizedExperienceYears = parseExperienceYears(experienceYears ?? year);
  const normalizedIdProofType = normalizeIdProofType(idProofType);
  const selfiePayload = liveSelfie || livePhoto;
  const idProofPayload = idProofFile || idCard;

  // Validation
  if (!email || !validateEmail(email)) {
    throw new AppError('Valid email is required', 400);
  }

  if (!gender) throw new AppError('Gender is required', 400);
  if (!normalizedFieldOfWork) throw new AppError('Field of work is required', 400);
  if (Number.isNaN(normalizedExperienceYears)) {
    throw new AppError('Experience/Year must be a number between 1 and 40', 400);
  }
  if (normalizedExperienceYears === null) {
    throw new AppError('Experience/Year is required', 400);
  }
  if (!bio || bio.length < 20) throw new AppError('Bio must be at least 20 characters', 400);
  if (!selfiePayload) throw new AppError('Live selfie is required', 400);
  if (!idProofPayload) throw new AppError('ID proof image is required', 400);

  const emailLower = email.toLowerCase().trim();

  // Find the user by any identity email field.
  let user = await User.findOne({
    $or: [
      { email: emailLower },
      { collegeEmail: emailLower },
      { personalEmail: emailLower }
    ]
  });

  if (!user) {
    throw new AppError('User not found. Please complete email verification first.', 404);
  }

  // Check if email was verified
  if (!user.emailVerified) {
    throw new AppError('Email not verified. Please verify OTP first.', 400);
  }

  // Update user with profile information
  user.gender = gender.toLowerCase();
  user.course = normalizedFieldOfWork;
  user.field_of_work = normalizedFieldOfWork;
  user.year = String(normalizedExperienceYears);
  user.experience_years = normalizedExperienceYears;
  user.shortAbout = String(bio || '').slice(0, 160);
  user.bio = bio;
  user.detailedBio = bio;
  user.interests = user.interests || [];
  user.prompts = user.prompts || [];
  user.gallery = user.gallery || [];
  user.livePhoto = undefined;
  user.idCard = undefined;
  user.verification_status = 'pending';
  user.profile_approval_status = 'pending';
  user.status = 'pending'; // Always pending until admin approves
  user.updated_at = new Date();

  const selfieDocument = await saveVerificationMediaFromDataUrl({
    userId: user._id,
    documentType: 'selfie',
    dataUrl: selfiePayload
  });
  const idProofDocument = await saveVerificationMediaFromDataUrl({
    userId: user._id,
    documentType: 'id-proof',
    dataUrl: idProofPayload
  });

  const existingSubmission = await VerificationSubmission.findOne({ userId: user._id });
  let submission;

  if (existingSubmission) {
    existingSubmission.status = 'pending';
    existingSubmission.idProofType = normalizedIdProofType;
    existingSubmission.documents = {
      selfie: {
        ...selfieDocument,
        originalName: 'live-selfie'
      },
      idProof: {
        ...idProofDocument,
        originalName: normalizedIdProofType
      }
    };
    existingSubmission.reviewNotes = '';
    existingSubmission.rejectionReason = '';
    existingSubmission.reviewedAt = undefined;
    existingSubmission.reviewedBy = undefined;
    existingSubmission.history.push({ action: 'resubmitted', note: 'User re-submitted verification documents' });
    submission = await existingSubmission.save();
  } else {
    submission = await VerificationSubmission.create({
      userId: user._id,
      status: 'pending',
      idProofType: normalizedIdProofType,
      documents: {
        selfie: {
          ...selfieDocument,
          originalName: 'live-selfie'
        },
        idProof: {
          ...idProofDocument,
          originalName: normalizedIdProofType
        }
      },
      history: [{ action: 'submitted', note: 'Initial verification submitted' }]
    });
  }

  user.verification_submission = submission._id;

  await user.save();
  console.log(`✓ User profile completed: ${user._id} (${email})`);

  // Send registration confirmation email (separate from OTP)
  try {
    await sendRegistrationConfirmationEmail(emailLower, user.name, user.college);
    console.log(`📧 Registration confirmation email sent to: ${emailLower}`);
  } catch (error) {
    console.error(`❌ Failed to send registration confirmation email: ${error.message}`);
    // Don't fail the signup if email fails - just log it
  }

  // Log activity
  await logActivity({
    user_id: user._id,
    action: 'signup_complete',
    description: `User completed profile signup with email ${email}`,
    ...getClientInfo(req),
    status: 'success'
  });

  // Generate token
  const token = generateToken(user._id);

  res.status(201).json(
    successResponse('Profile completed successfully. Awaiting admin approval.', {
      token,
      user: sanitizeUser(user)
    })
  );
}));

// ===== LOGIN =====
router.post('/login', loginLimiter, asyncHandler(async (req, res, _next) => {
  console.log('\n========== LOGIN REQUEST ==========');
  
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const emailLower = email.toLowerCase().trim();
  console.log(`🔐 Login attempt for: ${emailLower}`);

  // Find user by email (try all email fields)
  console.log(`📊 Querying User collection with email: ${emailLower}`);
  const user = await User.findOne({
    $or: [
      { email: emailLower },
      { collegeEmail: emailLower },
      { personalEmail: emailLower }
    ]
  });
  
  console.log(`📊 Query result: ${user ? 'FOUND' : 'NOT FOUND'}`);
  
  if (user) {
    console.log(`✓ User found: ${user._id} (${user.email})`);
  }

  if (!user) {
    console.log(`❌ User not found for email: ${emailLower}`);
    // Debug: Try to list all users
    const allUsers = await User.find({}).limit(5);
    console.log(`⚠️ Total users in collection: ${(await User.countDocuments())}`);
    console.log(`⚠️ Sample users: ${allUsers.map(u => u.email).join(', ')}`);
    throw new AppError('Invalid email or password', 401);
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    console.log(`❌ Password mismatch for: ${user.email}`);
    throw new AppError('Invalid email or password', 401);
  }

  console.log(`✓ Password valid`);

  // Check if account is banned
  if (user.status === 'banned') {
    console.log(`❌ Account banned: ${user.email}`);
    throw new AppError('Your account has been suspended', 403);
  }

  // Check if account is pending approval
  if (user.status === 'pending') {
    console.log(`❌ Account pending approval: ${user.email}`);
    throw new AppError('Your account is pending admin approval. Please wait for approval email.', 403);
  }

  if (user.status === 'rejected') {
    console.log(`❌ Account rejected: ${user.email}`);
    throw new AppError('Your registration was rejected by admin. Please contact support.', 403);
  }

  // Enforce role-specific sign-in paths: admin roles must use admin portal login.
  if (ADMIN_ROLES.includes(user.role)) {
    console.log(`❌ Admin role attempted user login route: ${user.email} (${user.role})`);
    throw new AppError('Admin accounts must sign in via the admin portal (/admin-login).', 403);
  }

  // Update last login
  user.last_login = new Date();
  await user.save();

  // Log activity
  await logActivity({
    user_id: user._id,
    action: 'login',
    description: `User logged in (Role: ${user.role})`,
    ...getClientInfo(req),
    status: 'success'
  });

  // Generate token
  const token = generateToken(user._id);

  console.log(`✓ Login successful for: ${user.email} (Role: ${user.role})`);

  res.json(
    successResponse('Login successful', {
      token,
      user: sanitizeUser(user)
    })
  );
}));

// ===== ADMIN LOGIN (Backend-validated) =====
router.post('/admin-login', loginLimiter, asyncHandler(async (req, res, _next) => {
  console.log('\n========== ADMIN LOGIN REQUEST ==========');
  
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const emailLower = email.toLowerCase().trim();
  console.log(`🔐 Admin login attempt for: ${emailLower}`);

  // Find user by email
  const admin = await User.findOne({
    $or: [
      { email: emailLower },
      { collegeEmail: emailLower },
      { personalEmail: emailLower }
    ]
  });

  if (!admin) {
    console.log(`❌ Admin not found for email: ${emailLower}`);
    throw new AppError('Invalid email or password', 401);
  }

  console.log(`✓ Admin found: ${admin._id} (${admin.email})`);

  // Check if user is admin (BACKEND VALIDATION)
  if (!ADMIN_ROLES.includes(admin.role)) {
    console.log(`❌ User is not admin. Role: ${admin.role}`);
    throw new AppError('Admin access required. User does not have admin permissions.', 403);
  }

  console.log(`✓ Admin role verified`);

  // Check password
  const isPasswordValid = await admin.comparePassword(password);
  if (!isPasswordValid) {
    console.log(`❌ Password mismatch for admin: ${admin.email}`);
    throw new AppError('Invalid email or password', 401);
  }

  console.log(`✓ Password valid`);

  // Check if account is banned
  if (admin.status === 'banned') {
    console.log(`❌ Admin account banned: ${admin.email}`);
    throw new AppError('Admin account has been suspended', 403);
  }

  // Update last login
  admin.last_login = new Date();
  await admin.save();

  // Log admin activity
  await logActivity({
    user_id: admin._id,
    admin_id: admin._id,
    action: 'admin_login',
    description: 'Admin logged into admin panel',
    ...getClientInfo(req),
    status: 'success'
  });

  const { session, accessToken, refreshToken, csrfToken } = await createAdminSession({ admin, req, mfaVerified: false });
  setAdminAuthCookies(res, { refreshToken, csrfToken });

  console.log(`✅ Admin login successful: ${admin.email}`);

  res.json(
    successResponse('Admin login successful', {
      token: accessToken,
      accessToken,
      csrfToken,
      session: {
        sessionId: session._id,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress,
        deviceInfo: session.deviceInfo,
        suspicious: Boolean(session.suspicious)
      },
      user: sanitizeUser(admin)
    })
  );
}));

// ===== GET CURRENT USER =====
router.get('/me', verifyFirebaseOrJwtAuth, asyncHandler(async (req, res, _next) => {
  if (!req.user) {
    throw new AppError('User not found', 404);
  }

  res.json(successResponse('User fetched', sanitizeUser(req.user)));
}));

// ===== UPDATE PROFILE =====
router.put('/profile', verifyFirebaseOrJwtAuth, asyncHandler(async (req, res, _next) => {
  const userId = req.userId;

  if (!userId) {
    throw new AppError('Authentication required', 401);
  }

  const {
    name,
    age,
    shortAbout,
    bio,
    detailedBio,
    interests,
    prompts,
    gallery,
    phone,
    profilePhoto,
    avatarConfig,
    privacy,
    collegeEmail
  } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Update only provided fields
  if (name) user.name = name.trim();
  if (age !== undefined && age !== null && age !== '') {
    const normalizedAge = Number(age);
    if (!Number.isFinite(normalizedAge) || normalizedAge < 17 || normalizedAge > 99) {
      throw new AppError('Age must be between 17 and 99', 400);
    }
    user.age = normalizedAge;
  }
  if (shortAbout !== undefined) user.shortAbout = String(shortAbout || '').trim().slice(0, 160);
  if (bio !== undefined) user.bio = bio;
  if (detailedBio !== undefined) user.detailedBio = String(detailedBio || '').slice(0, 2000);
  if (interests !== undefined) user.interests = interests;
  if (Array.isArray(prompts)) {
    user.prompts = prompts
      .map((item) => ({
        question: String(item?.question || '').trim().slice(0, 120),
        answer: String(item?.answer || '').trim().slice(0, 500)
      }))
      .filter((item) => item.question || item.answer)
      .slice(0, 12);
  }
  if (Array.isArray(gallery)) {
    user.gallery = gallery
      .map((item, idx) => ({
        imageUrl: String(item?.imageUrl || '').trim(),
        caption: String(item?.caption || '').trim().slice(0, 240),
        order: Number.isFinite(Number(item?.order)) ? Number(item.order) : idx
      }))
      .filter((item) => item.imageUrl)
      .slice(0, 12);
  }
  if (phone) {
    if (!validatePhone(phone)) {
      throw new AppError('Invalid phone format', 400);
    }
    user.phone = phone;
  }

  if (collegeEmail !== undefined) {
    const normalizedCollegeEmail = String(collegeEmail || '').trim().toLowerCase();
    if (normalizedCollegeEmail && !validateEmail(normalizedCollegeEmail)) {
      throw new AppError('Invalid college email format', 400);
    }
    user.collegeEmail = normalizedCollegeEmail || undefined;
    if (normalizedCollegeEmail) {
      user.college_verification_status = user.college_verification_status === 'verified' ? 'verified' : 'pending';
    }
  }

  if (privacy && typeof privacy === 'object') {
    user.privacy = {
      ...(user.privacy?.toObject?.() || user.privacy || {}),
      ...(privacy.profileVisibility ? { profileVisibility: privacy.profileVisibility } : {}),
      ...(privacy.showOnlineStatus !== undefined ? { showOnlineStatus: Boolean(privacy.showOnlineStatus) } : {}),
      ...(privacy.allowDiscovery !== undefined ? { allowDiscovery: Boolean(privacy.allowDiscovery) } : {}),
      ...(privacy.allowRequests !== undefined ? { allowRequests: Boolean(privacy.allowRequests) } : {}),
      ...(privacy.showVerifiedBadge !== undefined ? { showVerifiedBadge: Boolean(privacy.showVerifiedBadge) } : {}),
      fullProfile: {
        ...(user.privacy?.fullProfile?.toObject?.() || user.privacy?.fullProfile || {}),
        ...(privacy.fullProfile?.enabled !== undefined ? { enabled: Boolean(privacy.fullProfile.enabled) } : {}),
        ...(privacy.fullProfile?.requireSeparateApproval !== undefined ? { requireSeparateApproval: Boolean(privacy.fullProfile.requireSeparateApproval) } : {}),
        ...(privacy.fullProfile?.requestCooldownHours !== undefined ? { requestCooldownHours: Math.max(1, Math.min(720, Number(privacy.fullProfile.requestCooldownHours) || 72)) } : {}),
        ...(privacy.fullProfile?.onlyVerifiedRequesters !== undefined ? { onlyVerifiedRequesters: Boolean(privacy.fullProfile.onlyVerifiedRequesters) } : {}),
        ...(privacy.fullProfile?.onlyConnectedUsers !== undefined ? { onlyConnectedUsers: Boolean(privacy.fullProfile.onlyConnectedUsers) } : {}),
        ...(privacy.fullProfile?.sameCollegeOnly !== undefined ? { sameCollegeOnly: Boolean(privacy.fullProfile.sameCollegeOnly) } : {}),
        ...(privacy.fullProfile?.autoDeclineUnknownUsers !== undefined ? { autoDeclineUnknownUsers: Boolean(privacy.fullProfile.autoDeclineUnknownUsers) } : {})
      }
    };
  }
  // Public profile media (separate from verification livePhoto)
  if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
  if (avatarConfig !== undefined) user.avatarConfig = avatarConfig;

  await user.save();

  res.json(successResponse('Profile updated successfully', sanitizeUser(user)));
}));

// ===== FORGOT PASSWORD =====
router.post('/forgot-password', asyncHandler(async (req, res, _next) => {
  console.log('\n========== FORGOT PASSWORD REQUEST ==========');
  
  const { email } = req.body;

  // Validation
  if (!email || !validateEmail(email)) {
    throw new AppError('Valid email address is required', 400);
  }

  const emailLower = email.toLowerCase().trim();
  console.log(`🔍 Forgot password request for: ${emailLower}`);

  // Find user by email
  const user = await User.findOne({
    $or: [
      { email: emailLower },
      { collegeEmail: emailLower },
      { personalEmail: emailLower }
    ]
  });

  // Check if user exists and is approved
  if (!user) {
    console.log(`❌ User not found: ${emailLower}`);
    // Don't reveal if user exists - security
    return res.status(200).json(
      successResponse('If an account exists with this email, a password reset link will be sent.', {
        email: emailLower
      })
    );
  }

  // Only approved users can reset password
  if (user.status !== 'active') {
    console.log(`❌ User not approved for password reset: ${emailLower} (status: ${user.status})`);
    // Don't reveal actual status - security
    return res.status(200).json(
      successResponse('If an account exists with this email, a password reset link will be sent.', {
        email: emailLower
      })
    );
  }

  // Rate limiting for forgot password requests
  const MAX_RESET_REQUESTS = 3;
  const COOLDOWN_MINUTES = 60;
  const now = new Date();

  // Check if user is in cooldown period
  if (user.passwordResetTokenExpiry && now < user.passwordResetTokenExpiry) {
    const minutesRemaining = Math.ceil((user.passwordResetTokenExpiry - now) / 60000);
    console.log(`⏸️ User in cooldown for ${minutesRemaining}m`);
    // Still send success message for security (don't reveal if email exists)
    return res.status(200).json(
      successResponse('If an account exists with this email, a password reset link will be sent.', {
        email: emailLower
      })
    );
  }

  // Check if request count exceeded
  if (user.passwordResetRequestCount >= MAX_RESET_REQUESTS) {
    user.passwordResetTokenExpiry = new Date(now.getTime() + COOLDOWN_MINUTES * 60 * 1000);
    await user.save();
    console.log(`🛑 Max reset requests exceeded for ${emailLower}`);
    // Still send success message for security
    return res.status(200).json(
      successResponse('If an account exists with this email, a password reset link will be sent.', {
        email: emailLower
      })
    );
  }

  // Generate unique reset token (crypto-secure)
  const resetToken = randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

  // Update user with reset token
  user.passwordResetToken = resetToken;
  user.passwordResetTokenExpiry = resetTokenExpiry;
  user.passwordResetRequestCount = (user.passwordResetRequestCount || 0) + 1;
  user.passwordResetRequestLastTime = now;
  await user.save();

  console.log(`✅ Reset token generated for: ${emailLower}`);

  // Security: Always return success quickly to avoid leaking account existence
  // and to prevent client timeouts when SMTP is slow.
  console.log(`✅ Forgot password response sent for: ${emailLower}`);
  res.status(200).json(
    successResponse('If an account exists with this email, a password reset link will be sent.', {
      email: emailLower,
      message: 'Check your email for instructions'
    })
  );

  // Send email in background so API stays responsive under SMTP/network delays.
  setImmediate(async () => {
    try {
      await Promise.race([
        sendPasswordResetEmail(emailLower, resetToken),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Password reset email send timed out')), 15000);
        })
      ]);

      await logActivity({
        user_id: user._id,
        action: 'forgot_password_requested',
        description: 'User requested password reset',
        ...getClientInfo(req),
        status: 'success'
      });

      console.log(`📧 Password reset email sent to: ${emailLower}`);
    } catch (error) {
      console.error('❌ Background password reset email failed:', error.message);

      // Clear reset token on delivery failure so user can retry immediately.
      try {
        await User.findByIdAndUpdate(user._id, {
          $set: {
            passwordResetToken: null,
            passwordResetTokenExpiry: null
          },
          $inc: {
            passwordResetRequestCount: -1
          }
        });
      } catch (cleanupError) {
        console.error('⚠️ Failed to clear reset token after email failure:', cleanupError.message);
      }

      try {
        await logActivity({
          user_id: user._id,
          action: 'forgot_password_email_failed',
          description: `Password reset email failed: ${error.message}`,
          ...getClientInfo(req),
          status: 'failed'
        });
      } catch (logError) {
        console.error('⚠️ Failed to log forgot-password email failure:', logError.message);
      }
    }
  });
}));

// ===== VERIFY RESET TOKEN =====
router.get('/verify-reset-token/:token', asyncHandler(async (req, res, _next) => {
  console.log('\n========== VERIFY RESET TOKEN REQUEST ==========');
  
  const { token } = req.params;

  if (!token) {
    throw new AppError('Reset token is required', 400);
  }

  // Find user with this reset token
  const user = await User.findOne({
    passwordResetToken: token
  });

  if (!user) {
    console.log(`❌ Reset token not found`);
    throw new AppError('Invalid reset token', 400);
  }

  // Check if token has expired
  if (new Date() > user.passwordResetTokenExpiry) {
    console.log(`❌ Reset token expired for: ${user.email}`);
    user.passwordResetToken = null;
    user.passwordResetTokenExpiry = null;
    await user.save();
    throw new AppError('Reset token has expired. Please request a new password reset.', 400);
  }

  console.log(`✅ Reset token valid for: ${user.email}`);

  res.status(200).json(
    successResponse('Reset token is valid', {
      email: user.email,
      valid: true
    })
  );
}));

// ===== RESET PASSWORD =====
router.post('/reset-password', asyncHandler(async (req, res, _next) => {
  console.log('\n========== RESET PASSWORD REQUEST ==========');
  
  const { token, password, confirmPassword } = req.body;

  // Validation
  if (!token) {
    throw new AppError('Reset token is required', 400);
  }

  if (!password || !validatePassword(password)) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  if (password !== confirmPassword) {
    throw new AppError('Passwords do not match', 400);
  }

  // Find user with this reset token
  const user = await User.findOne({
    passwordResetToken: token
  });

  if (!user) {
    console.log(`❌ Reset token not found`);
    throw new AppError('Invalid reset token', 400);
  }

  // Check if token has expired
  if (new Date() > user.passwordResetTokenExpiry) {
    console.log(`❌ Reset token expired for: ${user.email}`);
    user.passwordResetToken = null;
    user.passwordResetTokenExpiry = null;
    await user.save();
    throw new AppError('Reset token has expired. Please request a new password reset.', 400);
  }

  console.log(`✅ Reset token valid for: ${user.email}`);

  // Update password
  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetTokenExpiry = null;
  user.passwordResetRequestCount = 0; // Reset request count after successful reset
  user.updated_at = new Date();
  await user.save();

  console.log(`✅ Password reset successfully for: ${user.email}`);

  // Log activity
  await logActivity({
    user_id: user._id,
    action: 'password_reset_success',
    description: 'User successfully reset their password',
    ...getClientInfo(req),
    status: 'success'
  });

  res.status(200).json(
    successResponse('Password reset successfully. You can now login with your new password.', {
      email: user.email,
      success: true,
      redirectUrl: '/login'
    })
  );
}));

// ===== UPDATE DISCOVERING PREFERENCE (Gender Filter) =====
router.put('/discovering-preference', verifyFirebaseOrJwtAuth, asyncHandler(async (req, res, _next) => {
  const { discoveringPreference } = req.body;
  const userId = req.userId;

  // Validation
  const validPreferences = ['male', 'female', 'both'];
  if (!discoveringPreference || !validPreferences.includes(String(discoveringPreference).toLowerCase())) {
    throw new AppError('Invalid discovering preference. Must be: male, female, or both', 400);
  }

  // Update user preference
  const user = await User.findByIdAndUpdate(
    userId,
    {
      discoveringPreference: String(discoveringPreference).toLowerCase(),
      updated_at: new Date()
    },
    { new: true, runValidators: true }
  ).select('_id name email gender discoveringPreference');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  await logActivity({
    user_id: userId,
    action: 'update_discovering_preference',
    description: `Gender preference updated to: ${discoveringPreference}`,
    ...getClientInfo(req),
    status: 'success'
  });

  res.status(200).json(
    successResponse('Discovering preference updated successfully', {
      user: sanitizeUser(user),
      discoveringPreference: user.discoveringPreference
    })
  );
}));

export default router;
