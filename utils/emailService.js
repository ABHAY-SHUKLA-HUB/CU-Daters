import nodemailer from 'nodemailer';
import dns from 'node:dns';
import dotenv from 'dotenv';

dotenv.config();

// Render/container networks sometimes resolve Gmail SMTP to IPv6 first, which can
// fail with ENETUNREACH when IPv6 routing is unavailable. Prefer IPv4 globally.
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (error) {
  console.warn('⚠️ Unable to set DNS result order to ipv4first:', error?.message || error);
}

// Detect if running in production
const isProduction = process.env.NODE_ENV === 'production' || (process.env.FRONTEND_URL && process.env.FRONTEND_URL.includes('netlify'));

const sanitizedEmailUser = String(
  process.env.EMAIL_USER ||
  process.env.SMTP_USER ||
  process.env.MAIL_USER ||
  ''
).trim();
// Gmail app passwords are often copied with spaces between groups. Remove all spaces.
const sanitizedEmailPassword = String(
  process.env.EMAIL_PASSWORD ||
  process.env.SMTP_PASSWORD ||
  process.env.EMAIL_PASS ||
  process.env.MAIL_PASSWORD ||
  ''
).replace(/\s+/g, '');
const smtpHost = String(process.env.SMTP_HOST || 'smtp.gmail.com').trim();
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = String(process.env.SMTP_SECURE || String(smtpPort === 465)).toLowerCase() === 'true';
const maxSmtpRetries = Math.max(1, Number(process.env.SMTP_RETRIES || 3));
const defaultFromAddress = String(
  process.env.EMAIL_FROM ||
  process.env.SMTP_FROM ||
  sanitizedEmailUser ||
  'cudaters.verify@gmail.com'
).trim();

const smtpHealth = {
  totalAttempts: 0,
  totalSuccesses: 0,
  totalFailures: 0,
  consecutiveFailures: 0,
  lastSuccessAt: null,
  lastFailureAt: null,
  lastErrorCode: null,
  lastErrorMessage: null
};

// Create transporter based on environment
let transporter;
const fallbackTransporters = [];

const createSmtpTransporter = ({ host, port, secure }) => nodemailer.createTransport({
  host,
  port,
  secure,
  requireTLS: !secure,
  family: 4,
  auth: {
    user: sanitizedEmailUser,
    pass: sanitizedEmailPassword
  },
  connectionTimeout: 15000,
  socketTimeout: 15000,
  tls: {
    rejectUnauthorized: false
  }
});

const sendMailAsync = (mailTransporter, mailOptions) => new Promise((resolve, reject) => {
  mailTransporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      reject(error);
    } else {
      resolve(info);
    }
  });
});

const shouldTryFallback = (error) => {
  const code = String(error?.code || '').toUpperCase();
  const msg = String(error?.message || '').toLowerCase();
  return [
    'ETIMEDOUT',
    'ECONNECTION',
    'ECONNRESET',
    'ECONNREFUSED',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'ESOCKET'
  ].includes(code) || msg.includes('timed out') || msg.includes('connection closed');
};

const wait = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const recordSmtpSuccess = () => {
  smtpHealth.totalAttempts += 1;
  smtpHealth.totalSuccesses += 1;
  smtpHealth.consecutiveFailures = 0;
  smtpHealth.lastSuccessAt = new Date().toISOString();
  smtpHealth.lastErrorCode = null;
  smtpHealth.lastErrorMessage = null;
};

const recordSmtpFailure = (error) => {
  smtpHealth.totalAttempts += 1;
  smtpHealth.totalFailures += 1;
  smtpHealth.consecutiveFailures += 1;
  smtpHealth.lastFailureAt = new Date().toISOString();
  smtpHealth.lastErrorCode = String(error?.code || 'UNKNOWN');
  smtpHealth.lastErrorMessage = String(error?.message || 'SMTP send failed');
};

export const getEmailServiceHealth = () => {
  const configured = Boolean(sanitizedEmailUser && sanitizedEmailPassword);
  const degraded = configured && smtpHealth.consecutiveFailures >= 3;

  return {
    configured,
    mode: configured ? 'smtp' : 'console-dev',
    smtp: {
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      retries: maxSmtpRetries
    },
    counters: {
      totalAttempts: smtpHealth.totalAttempts,
      totalSuccesses: smtpHealth.totalSuccesses,
      totalFailures: smtpHealth.totalFailures,
      consecutiveFailures: smtpHealth.consecutiveFailures
    },
    lastSuccessAt: smtpHealth.lastSuccessAt,
    lastFailureAt: smtpHealth.lastFailureAt,
    lastErrorCode: smtpHealth.lastErrorCode,
    lastErrorMessage: smtpHealth.lastErrorMessage,
    degraded
  };
};

const sendMailWithFallback = async (mailOptions) => {
  const candidates = [transporter, ...fallbackTransporters].filter(Boolean);
  let lastError = null;

  for (let attempt = 1; attempt <= maxSmtpRetries; attempt += 1) {
    for (let i = 0; i < candidates.length; i += 1) {
      try {
        const info = await sendMailAsync(candidates[i], mailOptions);
        if (i > 0) {
          console.warn(`⚠️ Email sent via fallback SMTP candidate #${i + 1}`);
        }
        if (attempt > 1) {
          console.warn(`⚠️ Email send succeeded on retry attempt #${attempt}`);
        }
        recordSmtpSuccess();
        return info;
      } catch (error) {
        lastError = error;
        const code = error?.code || 'UNKNOWN';
        console.error(`❌ SMTP attempt ${attempt}/${maxSmtpRetries}, candidate #${i + 1} failed:`, code, error?.message || error);
        if (!shouldTryFallback(error)) {
          throw error;
        }
      }
    }

    if (attempt < maxSmtpRetries) {
      const retryDelayMs = 700 * attempt;
      console.warn(`⚠️ Retrying email send in ${retryDelayMs}ms...`);
      await wait(retryDelayMs);
    }
  }

  recordSmtpFailure(lastError);
  throw lastError || new Error('All SMTP transport attempts failed');
};

console.log('\n' + '='.repeat(80));
console.log('📧 [STARTUP] Email Service Initialize');
console.log('='.repeat(80));
console.log(`   - Node Env: ${process.env.NODE_ENV}`);
console.log(`   - Email User: ${sanitizedEmailUser || '✗ NOT SET'}`);
console.log(`   - Email Password: ${sanitizedEmailPassword ? '✓ SET (' + sanitizedEmailPassword.length + ' chars)' : '✗ NOT SET'}`);
console.log(`   - SMTP Host: ${smtpHost}`);
console.log(`   - SMTP Port: ${smtpPort}`);
console.log(`   - SMTP Secure: ${smtpSecure}`);
console.log(`   - Production Mode: ${isProduction}`);
console.log(`   - Retries: ${maxSmtpRetries}`);
console.log('='.repeat(80));

if (!sanitizedEmailPassword) {
  // Development mode: Show OTP in console
  console.log('📧 [DEV MODE] Emails will be shown in backend console\n');
  transporter = {
    sendMail: (options, callback) => {
      console.log('📧 [CONSOLE EMAIL]', {
        to: options.to,
        subject: options.subject
      });
      callback(null, { messageId: 'dev-console-' + Date.now() });
    },
    verify: (callback) => {
      callback(null, true);
    }
  };
} else {
  // Production mode: Use Gmail with app password
  console.log('📧 [PRODUCTION MODE] Using Gmail SMTP\n');
  
  transporter = createSmtpTransporter({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure
  });

  if (!(smtpHost === 'smtp.gmail.com' && smtpPort === 465 && smtpSecure === true)) {
    fallbackTransporters.push(createSmtpTransporter({ host: 'smtp.gmail.com', port: 465, secure: true }));
  }

  if (!(smtpHost === 'smtp.gmail.com' && smtpPort === 587 && smtpSecure === false)) {
    fallbackTransporters.push(createSmtpTransporter({ host: 'smtp.gmail.com', port: 587, secure: false }));
  }
}

// Verify Gmail connection only in production
if (isProduction && sanitizedEmailPassword) {
  transporter.verify()
    .then(() => {
      console.log('✅ Gmail SMTP Connection Verified!');
      console.log('   OTP emails will be sent via Gmail SMTP\n');
    })
    .catch((error) => {
      console.error('\n' + '='.repeat(80));
      console.error('❌ CRITICAL: Gmail SMTP Connection Failed!');
      console.error('='.repeat(80));
      console.error('Error:', error.message);
      console.error('\n📋 TROUBLESHOOTING STEPS:');
      console.error('┌─ 1. Verify Environment Variables');
      console.error('│  · Check EMAIL_USER = ' + (sanitizedEmailUser || 'NOT SET'));
      console.error('│  · Check EMAIL_PASSWORD is set (show as ✓ above)');
      console.error('│  · If not set, .env file not found or missing these variables');
      console.error('└─ Location: d:\\New folder\\datee-main\\.env');
      console.error('\n┌─ 2. Generate New Gmail App Password');
      console.error('│  · Go to myaccount.google.com');
      console.error('│  · Click "Security" in left menu');
      console.error('│  · Find "App passwords"');
      console.error('│  · Select "Mail" and your device type');
      console.error('│  · Click "Generate"');
      console.error('│  · Copy the 16-character password (no spaces)');
      console.error('│  · Update EMAIL_PASSWORD in .env');
      console.error('└─ Important: Must use app password, NOT your regular Gmail password');
      console.error('\n┌─ 3. Enable 2-Factor Authentication (Required)');
      console.error('│  · Go to myaccount.google.com/security');
      console.error('│  · Find "2-Step Verification"');
      console.error('│  · If disabled, click to enable it');
      console.error('└─ 2FA must be enabled before you can use app passwords');
      console.error('\n┌─ 4. Check Network Connection');
      console.error('│  · Run: Test-NetConnection -ComputerName smtp.gmail.com -Port 587');
      console.error('│  · Result should show: TcpTestSucceeded : True');
      console.error('│  · If False, check firewall/network settings');
      console.error('└─ Gmail SMTP requires outbound access on port 587 or 465');
      console.error('\n┌─ 5. Restart Backend After Changes');
      console.error('│  · Stop current process (Ctrl+C)');
      console.error('│  · Update .env file');
      console.error('│  · Restart: npm run dev (or your start command)');
      console.error('└─ Changes to .env require backend restart');
      console.error('\n' + '='.repeat(80));
      console.error(`Error Type: ${error.code || error.name || 'UNKNOWN'}`);
      console.error(`Full Message: ${error.message}\n`);
    });
}

/**
 * Send OTP email to user
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @returns {Promise}
 */
export const sendOtpEmail = async (email, otp) => {
  try {
    // In development or if email not configured, show OTP in console
    if (!sanitizedEmailPassword) {
      console.log('\n' + '='.repeat(80));
      console.log('📧 [DEV MODE - OTP EMAIL]');
      console.log('='.repeat(80));
      console.log(`TO: ${email}`);
      console.log(`OTP CODE: ${otp}`);
      console.log(`EXPIRES: 5 minutes from now`);
      console.log('='.repeat(80) + '\n');
      
      return { success: true, mode: 'console', email, otp };
    }

    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CU Daters - Email Verification</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #fff5f7 0%, #fffbf0 100%); padding: 40px 20px; }
          .card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(212, 83, 111, 0.1); }
          .header { background: linear-gradient(135deg, #d4536f 0%, #e8889f 100%); padding: 30px; text-align: center; color: white; }
          .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
          .header p { font-size: 14px; opacity: 0.95; }
          .logo { font-size: 12px; font-weight: 600; letter-spacing: 2px; opacity: 0.9; margin-bottom: 12px; }
          .content { padding: 40px 30px; text-align: center; }
          .intro { font-size: 16px; color: #555; margin-bottom: 30px; line-height: 1.6; }
          .otp-box { background: linear-gradient(135deg, #fff5f7 0%, #fffbf0 100%); border: 2px solid #d4536f; border-radius: 10px; padding: 25px; margin: 30px 0; }
          .otp-code { font-size: 42px; font-weight: 700; letter-spacing: 8px; color: #d4536f; font-family: 'Courier New', monospace; }
          .otp-label { font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-top: 12px; }
          .timer { background: #fff9e6; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 6px; font-size: 14px; color: #856404; }
          .instructions { background: #f0f8ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 6px; font-size: 14px; color: #004687; }
          .instructions strong { color: #d4536f; }
          .footer { background: #f8f9fa; padding: 25px 30px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #777; }
          .security-note { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 12px 15px; margin: 15px 0; border-radius: 6px; font-size: 12px; color: #2e7d32; }
          .support-link { color: #d4536f; text-decoration: none; font-weight: 600; }
          .divider { height: 1px; background: #e0e0e0; margin: 20px 0; }
          @media (max-width: 600px) {
            .container { padding: 20px 10px; }
            .content { padding: 25px 15px; }
            .otp-code { font-size: 32px; letter-spacing: 6px; }
            .header { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <!-- Header -->
            <div class="header">
              <div class="logo">💖 CU DATERS 💖</div>
              <h1>Email Verification</h1>
              <p>Secure your account with a one-time verification code</p>
            </div>

            <!-- Content -->
            <div class="content">
              <p class="intro">Hi there! 👋 Welcome to CU Daters – your campus dating community. To complete your registration, please use the verification code below:</p>

              <!-- OTP Box -->
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <div class="otp-label">Verification Code</div>
              </div>

              <!-- Instructions -->
              <div class="instructions">
                <strong>✓ How to use:</strong> Enter this code in the verification field on CU Daters to confirm your email address and activate your account.
              </div>

              <!-- Timer -->
              <div class="timer">
                ⏱️ <strong>This code is valid for 5 minutes only.</strong> If it expires, you can request a new one.
              </div>

              <!-- Divider -->
              <div class="divider"></div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="security-note">
                🔒 <strong>Never share this code</strong> with anyone. CU Daters support will never ask for your verification code.
              </div>
              
              <p style="margin-top: 15px;">Need help? <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/support" class="support-link">Contact Support</a></p>
              
              <div class="divider" style="margin: 15px 0;"></div>
              
              <p>© 2026 CU Daters. All rights reserved.</p>
              <p>Your trusted campus dating platform | <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/privacy" class="support-link" style="color: #999;">Privacy Policy</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: defaultFromAddress,
      to: email,
      subject: '💖 Your CU Daters Verification Code',
      html: htmlTemplate,
      text: `CU Daters Verification Code: ${otp}\n\nThis code is valid for 5 minutes.\n\nDo not share this code with anyone.\n\nIf you didn't request this code, please ignore this email.`
    };

    const result = await sendMailWithFallback(mailOptions);
    
    console.log('✅ OTP email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('❌ Error sending OTP email');
    console.error('='.repeat(80));
    console.error('📧 Debugging Info:');
    console.error('  - Email User:', sanitizedEmailUser || '✗ NOT SET');
    console.error('  - Email Pass Set:', sanitizedEmailPassword ? '✓ YES' : '✗ NOT SET');
    console.error('  - Recipient:', email);
    console.error('  - Error Type:', error.code || error.name || 'UNKNOWN');
    console.error('  - Error Message:', error.message);
    console.error('  - SMTP Health:');
    console.error('    · Total Attempts:', smtpHealth.totalAttempts);
    console.error('    · Consecutive Failures:', smtpHealth.consecutiveFailures);
    console.error('    · Last Error Code:', smtpHealth.lastErrorCode);
    console.error('  - Timestamp:', new Date().toISOString());
    console.error('\n📋 RECOVERY STEPS:');
    
    // Specific error handling
    if (error.message.includes('Invalid login') || error.message.includes('535') || error.code === 'EAUTH') {
      console.error('  ⚠️  Authentication Issue Detected (Error 535)');
      console.error('  1. Go to myaccount.google.com/apppasswords');
      console.error('  2. Generate a NEW 16-character app password');
      console.error('  3. Update EMAIL_PASSWORD in .env (copy without spaces)');
      console.error('  4. Restart backend');
      throw new Error(`❌ Gmail Authentication Failed - Check EMAIL_USER and EMAIL_PASSWORD in .env`);
    }
    
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT') || error.code === 'ETIMEDOUT') {
      console.error('  ⚠️  Connection Timeout Issue Detected');
      console.error('  1. Check network connection: Test-NetConnection -ComputerName smtp.gmail.com -Port 587');
      console.error('  2. Check firewall allows port 587 outbound');
      console.error('  3. Verify SMTP_HOST and SMTP_PORT in .env');
      console.error('  4. Try using port 465 (SMTP_PORT=465, SMTP_SECURE=true)');
      throw new Error(`⏱️  SMTP Connection Timeout - Check network and firewall settings`);
    }
    
    if (error.message.includes('Connection refused') || error.code === 'ECONNREFUSED') {
      console.error('  ⚠️  Connection Refused - Server may be down or port blocked');
      console.error('  1. Verify Gmail SMTP is reachable: Test-NetConnection -ComputerName smtp.gmail.com -Port 587');
      console.error('  2. Check SMTP_HOST=smtp.gmail.com in .env');
      console.error('  3. Try port 465 if 587 is blocked');
      throw new Error(`🚫 SMTP Server refused connection - Check SMTP settings`);
    }
    
    console.error('\n' + '='.repeat(80));
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};

/**
 * Send approval notification email
 * @param {string} email - Recipient email
 * @param {string} name - User name
 * @returns {Promise}
 */
export const sendApprovalEmail = async (email, name) => {
  try {
    const mailOptions = {
      from: defaultFromAddress,
      to: email,
      subject: '✅ Your CU Daters Profile Has Been Approved!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #d4536f;">Hi ${name},</h2>
          <p>Great news! Your profile on CU Daters has been approved and is now live!</p>
          <p>You can now start exploring profiles and connecting with other students.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" style="display: inline-block; background-color: #d4536f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Go to Dashboard
          </a>
          <p>Happy dating! 💕</p>
        </div>
      `
    };

    await sendMailWithFallback(mailOptions);
    console.log('✅ Approval email sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending approval email:', error.message);
    throw new Error(`Failed to send approval email: ${error.message}`);
  }
};

/**
 * Send rejection notification email
 * @param {string} email - Recipient email
 * @param {string} name - User name
 * @param {string} reason - Rejection reason
 * @returns {Promise}
 */
export const sendRejectionEmail = async (email, name, reason) => {
  try {
    const mailOptions = {
      from: defaultFromAddress,
      to: email,
      subject: '❌ CU Daters Profile Review',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #d4536f;">Hi ${name},</h2>
          <p>Thank you for signing up on CU Daters!</p>
          <p>Unfortunately, your profile could not be approved at this time:</p>
          <p style="background-color: #f0f0f0; padding: 15px; border-left: 4px solid #d4536f;">
            ${reason || 'Your profile did not meet our verification standards.'}
          </p>
          <p>You can submit your profile again with corrected information.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="display: inline-block; background-color: #d4536f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
            Try Again
          </a>
        </div>
      `
    };

    await sendMailWithFallback(mailOptions);
    console.log('✅ Rejection email sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending rejection email:', error.message);
    throw new Error(`Failed to send rejection email: ${error.message}`);
  }
};

/**
 * Send password reset email with token link
 * @param {string} email - Recipient email
 * @param {string} resetToken - Password reset token
 * @returns {Promise}
 */
export const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    // In development, log the reset link instead of sending
    if (!sanitizedEmailPassword) {
      const devResetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;
      console.log('\n' + '='.repeat(80));
      console.log('📧 [DEVELOPMENT MODE - PASSWORD RESET EMAIL]');
      console.log('='.repeat(80));
      console.log(`TO: ${email}`);
      console.log(`RESET LINK: ${devResetUrl}`);
      console.log(`EXPIRES: 1 hour from now`);
      console.log('='.repeat(80) + '\n');
      
      return { success: true, mode: 'development' };
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CU Daters - Reset Your Password</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #fff5f7 0%, #fffbf0 100%); padding: 40px 20px; }
          .card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(212, 83, 111, 0.1); }
          .header { background: linear-gradient(135deg, #d4536f 0%, #e8889f 100%); padding: 30px; text-align: center; color: white; }
          .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
          .header p { font-size: 14px; opacity: 0.95; }
          .logo { font-size: 12px; font-weight: 600; letter-spacing: 2px; opacity: 0.9; margin-bottom: 12px; }
          .content { padding: 40px 30px; text-align: center; }
          .intro { font-size: 16px; color: #555; margin-bottom: 30px; line-height: 1.6; }
          .button-container { margin: 30px 0; }
          .reset-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #d4536f 0%, #e8889f 100%); 
            color: white; 
            text-decoration: none; 
            padding: 15px 40px; 
            border-radius: 8px; 
            font-weight: 700; 
            font-size: 16px;
            transition: transform 0.2s ease;
          }
          .reset-button:hover { transform: translateY(-2px); }
          .timer { background: #fff9e6; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 6px; font-size: 14px; color: #856404; }
          .instructions { background: #f0f8ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 6px; font-size: 14px; color: #004687; }
          .warning { background: #ffe6e6; border-left: 4px solid #ff4444; padding: 15px; margin: 20px 0; border-radius: 6px; font-size: 14px; color: #cc0000; }
          .footer { background: #f8f9fa; padding: 25px 30px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #777; }
          .security-note { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 12px 15px; margin: 15px 0; border-radius: 6px; font-size: 12px; color: #2e7d32; }
          .support-link { color: #d4536f; text-decoration: none; font-weight: 600; }
          .divider { height: 1px; background: #e0e0e0; margin: 20px 0; }
          @media (max-width: 600px) {
            .container { padding: 20px 10px; }
            .content { padding: 25px 15px; }
            .reset-button { padding: 12px 30px; font-size: 14px; }
            .header { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <!-- Header -->
            <div class="header">
              <div class="logo">💖 CU DATERS 💖</div>
              <h1>Password Reset Request</h1>
              <p>We received a request to reset your password</p>
            </div>

            <!-- Content -->
            <div class="content">
              <p class="intro">Hi there! 👋 If you requested to reset your password, click the button below to set a new password:</p>

              <!-- Reset Button -->
              <div class="button-container">
                <a href="${resetUrl}" class="reset-button">🔐 Reset Your Password</a>
              </div>

              <!-- Timer -->
              <div class="timer">
                ⏱️ <strong>This link is valid for 1 hour only.</strong> After that, you'll need to request a new reset link.
              </div>

              <!-- Instructions -->
              <div class="instructions">
                <strong>✓ Alternative:</strong> If the button doesn't work, copy and paste this link in your browser:<br><br>
                <small style="word-break: break-all;"><a href="${resetUrl}" class="support-link">${resetUrl}</a></small>
              </div>

              <!-- Warning -->
              <div class="warning">
                <strong>⚠️ Didn't request this?</strong> If you didn't request a password reset, please ignore this email. Your account is secure. If you suspect unauthorized access, <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/contact" class="support-link" style="color: #cc0000;">contact our support team</a> immediately.
              </div>

              <!-- Divider -->
              <div class="divider"></div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <div class="security-note">
                🔒 <strong>Never share this link</strong> with anyone. CU Daters support will never ask for your reset link.
              </div>
              
              <p style="margin-top: 15px;">Need help? <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/contact" class="support-link">Contact Support</a></p>
              
              <div class="divider" style="margin: 15px 0;"></div>
              
              <p>© 2026 CU Daters. All rights reserved.</p>
              <p>Your trusted campus dating platform | <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/privacy" class="support-link" style="color: #999;">Privacy Policy</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: defaultFromAddress,
      to: email,
      subject: '🔐 CU Daters Password Reset Request',
      html: htmlTemplate,
      text: `Password Reset Request\n\nClick this link to reset your password:\n${resetUrl}\n\nThis link is valid for 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nYour account is secure.`
    };

    const result = await sendMailWithFallback(mailOptions);
    
    console.log('✅ Password reset email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

/**
 * Send registration confirmation email (separate from OTP)
 * @param {string} email - Recipient email
 * @param {string} name - User name
 * @param {string} college - User college
 * @returns {Promise}
 */
export const sendRegistrationConfirmationEmail = async (email, name, college) => {
  try {
    // In development, log the email
    if (!sanitizedEmailPassword) {
      console.log('\n' + '='.repeat(80));
      console.log('📧 [DEV MODE - REGISTRATION CONFIRMATION EMAIL]');
      console.log('='.repeat(80));
      console.log(`TO: ${email}`);
      console.log(`NAME: ${name}`);
      console.log(`COLLEGE: ${college}`);
      console.log(`STATUS: Pending Approval (24-48 hours)`);
      console.log('='.repeat(80) + '\n');
      
      return { success: true, mode: 'development' };
    }

    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CU Daters - Registration Pending Approval</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f9f9f9; }
          .container { max-width: 620px; margin: 0 auto; padding: 20px; }
          .card { background: white; border-radius: 14px; overflow: hidden; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08); }
          
          .header { background: linear-gradient(135deg, #d4536f 0%, #e8889f 100%); padding: 40px 30px; text-align: center; color: white; }
          .logo { font-size: 13px; font-weight: 700; letter-spacing: 3px; opacity: 0.95; margin-bottom: 20px; text-transform: uppercase; }
          .heart { font-size: 32px; display: block; margin-bottom: 15px; }
          .header h1 { font-size: 32px; font-weight: 700; margin-bottom: 10px; }
          .header p { font-size: 15px; opacity: 0.95; line-height: 1.5; }
          
          .content { padding: 45px 35px; }
          .greeting { font-size: 18px; color: #2d3748; margin-bottom: 25px; line-height: 1.6; }
          .greeting strong { color: #d4536f; }
          
          .status-box { background: linear-gradient(135deg, #fff5f7 0%, #fffbf0 100%); border-left: 5px solid #ffc107; padding: 20px; margin: 30px 0; border-radius: 8px; }
          .status-title { font-size: 13px; font-weight: 700; color: #d4536f; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          .status-message { font-size: 15px; color: #5a6c7d; line-height: 1.6; }
          .timer { font-weight: 600; color: #d4536f; }
          
          .summary-box { background: #f8f9fa; border: 1px solid #e2e8f0; padding: 25px; margin: 30px 0; border-radius: 10px; }
          .summary-title { font-size: 13px; font-weight: 700; color: #2d3748; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 18px; text-align: center; }
          .summary-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-size: 15px; }
          .summary-row:last-child { border-bottom: none; }
          .summary-label { font-weight: 600; color: #5a6c7d; }
          .summary-value { color: #2d3748; font-weight: 500; text-align: right; word-break: break-word; max-width: 50%; }
          
          .faq-section { margin: 35px 0; }
          .faq-title { font-size: 13px; font-weight: 700; color: #2d3748; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
          .faq-item { margin-bottom: 20px; }
          .faq-question { font-size: 15px; font-weight: 600; color: #d4536f; margin-bottom: 8px; }
          .faq-answer { font-size: 14px; color: #5a6c7d; line-height: 1.6; }
          
          .footer { background: #f8f9fa; padding: 30px 35px; border-top: 1px solid #e2e8f0; text-align: center; }
          .support-link { color: #d4536f; text-decoration: none; font-weight: 600; }
          .footer-text { font-size: 13px; color: #a0aec0; margin-top: 15px; line-height: 1.6; }
          .divider { height: 1px; background: #e2e8f0; margin: 20px 0; }
          
          @media (max-width: 600px) {
            .header { padding: 25px 20px; }
            .header h1 { font-size: 24px; }
            .content { padding: 25px 20px; }
            .footer { padding: 20px; }
            .summary-row { flex-direction: column; }
            .summary-value { max-width: 100%; text-align: left; margin-top: 5px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <!-- Header -->
            <div class="header">
              <div class="heart">💖</div>
              <div class="logo">CU Daters</div>
              <h1>Registration Received!</h1>
              <p>Your application is under review</p>
            </div>

            <!-- Content -->
            <div class="content">
              <!-- Greeting -->
              <div class="greeting">
                Hey <strong>${name}</strong>! 👋
                <br><br>
                Thank you for joining CU Daters – your trusted campus dating platform. Your profile has been successfully submitted and is now pending approval.
              </div>

              <!-- Status Box -->
              <div class="status-box">
                <div class="status-title">⏳ Account Status</div>
                <div class="status-message">
                  Your profile is <strong>under review</strong> by our verification team. We typically review and approve profiles within <span class="timer">24-48 hours</span>. You'll receive an email notification as soon as your account is approved!
                </div>
              </div>

              <!-- Summary Box -->
              <div class="summary-box">
                <div class="summary-title">✓ Registration Summary</div>
                <div class="summary-row">
                  <span class="summary-label">Name</span>
                  <span class="summary-value">${name}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Email</span>
                  <span class="summary-value">${email}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">College</span>
                  <span class="summary-value">${college}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Status</span>
                  <span class="summary-value" style="color: #ffc107; font-weight: 600;">Pending Approval</span>
                </div>
              </div>

              <!-- FAQ Section -->
              <div class="faq-section">
                <div class="faq-title">❓ Frequently Asked Questions</div>
                
                <div class="faq-item">
                  <div class="faq-question">How long does approval take?</div>
                  <div class="faq-answer">Most profiles are approved within 24-48 hours. This helps us maintain a safe and genuine community on CU Daters.</div>
                </div>

                <div class="faq-item">
                  <div class="faq-question">Can I edit my profile before approval?</div>
                  <div class="faq-answer">Once your profile is submitted, you cannot edit it until after approval. You can then update your information anytime from your dashboard.</div>
                </div>

                <div class="faq-item">
                  <div class="faq-question">What if my profile is rejected?</div>
                  <div class="faq-answer">If rejected, you'll receive an email with the reason. Don't worry! You can resubmit with corrections and we'll review it again.</div>
                </div>

                <div class="faq-item">
                  <div class="faq-question">Is my information secure?</div>
                  <div class="faq-answer">100% Yes! Your data is encrypted and protected. We follow strict privacy policies to keep your information safe.</div>
                </div>
              </div>

              <div class="divider"></div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p style="font-size: 15px; color: #2d3748; margin-bottom: 15px;">
                Need help? Contact our support team
              </p>
              <a href="mailto:support@cudaters.com" class="support-link" style="display: inline-block; background-color: #d4536f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; transition: all 0.3s ease;">
                📧 support@cudaters.com
              </a>
              
              <div class="footer-text">
                <p style="margin-top: 20px;">© 2026 CU Daters. All rights reserved.</p>
                <p style="margin-top: 10px;">Your trusted campus dating platform</p>
                <p style="margin-top: 10px;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/privacy" class="support-link" style="color: #d4536f;">Privacy Policy</a> | 
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/terms" class="support-link" style="color: #d4536f;">Terms of Service</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: defaultFromAddress,
      to: email,
      subject: '✨ Your Registration is Pending Approval – CU DATERS',
      html: htmlTemplate,
      text: `Hi ${name}!\n\nThank you for registering on CU Daters! Your profile is under review and will be approved within 24-48 hours.\n\nRegistration Summary:\nName: ${name}\nEmail: ${email}\nCollege: ${college}\nStatus: Pending Approval\n\nYou'll receive an email once your profile is approved.\n\nFor support, contact: support@cudaters.com\n\nBest regards,\nCU Daters Team`
    };

    const result = await sendMailWithFallback(mailOptions);
    
    console.log('✅ Registration confirmation email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending registration confirmation email:', error.message);
    throw new Error(`Failed to send registration confirmation email: ${error.message}`);
  }
};

export default {
  getEmailServiceHealth,
  sendOtpEmail,
  sendApprovalEmail,
  sendRejectionEmail,
  sendPasswordResetEmail,
  sendRegistrationConfirmationEmail
};
