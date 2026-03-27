import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// ===========================
// EMAIL SERVICE - Mailgun HTTP API
// ===========================
// Uses HTTPS REST API - works perfectly on Render!
// ✅ No SMTP/port 587 blocking issues
// ✅ Free tier: 300 emails/month

const mailgunApiKey = String(process.env.MAILGUN_API_KEY || '').trim();
const mailgunDomain = String(process.env.MAILGUN_DOMAIN || '').trim();
const mailgunFromEmail = String(process.env.MAILGUN_FROM_EMAIL || 'noreply@cudaters.tech').trim();
const hasMailgunConfig = Boolean(mailgunApiKey && mailgunDomain);

console.log('\n' + '='.repeat(80));
console.log('📧 EMAIL SERVICE - MAILGUN HTTPS API');
console.log('='.repeat(80));
console.log(`Configured: ${hasMailgunConfig ? '✅ YES' : '❌ NO'}`);
if (hasMailgunConfig) {
  console.log(`Domain: ${mailgunDomain}`);
  console.log(`From: ${mailgunFromEmail}`);
  console.log(`Free Tier: 300 emails/month`);
  console.log(`Endpoint: https://api.mailgun.net/v3/${mailgunDomain}/messages`);
}
console.log('='.repeat(80) + '\n');

// ===========================
// Email Health Tracking
// ===========================
const emailHealth = {
  totalAttempts: 0,
  totalSuccesses: 0,
  totalFailures: 0,
  consecutiveFailures: 0,
  lastSuccessAt: null,
  lastFailureAt: null,
  lastErrorCode: null,
  lastErrorMessage: null
};

const recordSuccess = () => {
  emailHealth.totalAttempts += 1;
  emailHealth.totalSuccesses += 1;
  emailHealth.consecutiveFailures = 0;
  emailHealth.lastSuccessAt = new Date().toISOString();
  emailHealth.lastErrorCode = null;
  emailHealth.lastErrorMessage = null;
};

const recordFailure = (error) => {
  emailHealth.totalAttempts += 1;
  emailHealth.totalFailures += 1;
  emailHealth.consecutiveFailures += 1;
  emailHealth.lastFailureAt = new Date().toISOString();
  emailHealth.lastErrorCode = error?.code || 'UNKNOWN';
  emailHealth.lastErrorMessage = error?.message || 'Unknown error';
};

export const getEmailServiceHealth = () => ({
  configured: hasMailgunConfig,
  backend: 'mailgun',
  counters: {
    totalAttempts: emailHealth.totalAttempts,
    totalSuccesses: emailHealth.totalSuccesses,
    totalFailures: emailHealth.totalFailures,
    consecutiveFailures: emailHealth.consecutiveFailures
  },
  lastSuccessAt: emailHealth.lastSuccessAt,
  lastFailureAt: emailHealth.lastFailureAt,
  lastErrorCode: emailHealth.lastErrorCode,
  lastErrorMessage: emailHealth.lastErrorMessage,
  degraded: emailHealth.consecutiveFailures >= 3
});

// ===========================
// Mailgun HTTP API Helper
// ===========================
const sendViaMailgun = async (to, subject, htmlContent) => {
  if (!hasMailgunConfig) {
    throw new Error('Mailgun not configured - set MAILGUN_API_KEY and MAILGUN_DOMAIN');
  }

  console.log(`[MAILGUN] 📧 Sending to ${to}...`);

  const auth = Buffer.from(`api:${mailgunApiKey}`).toString('base64');

  try {
    const response = await axios.post(
      `https://api.mailgun.net/v3/${mailgunDomain}/messages`,
      new URLSearchParams({
        from: mailgunFromEmail,
        to: to,
        subject: subject,
        html: htmlContent
      }),
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 30000  // 30s HTTP timeout
      }
    );

    const messageId = response.data.id || 'unknown';
    console.log(`[MAILGUN] ✅ Email sent successfully`);
    console.log(`[MAILGUN]    Message ID: ${messageId}`);
    console.log(`[MAILGUN]    To: ${to}`);
    recordSuccess();
    return { messageId, to, status: 'success' };
  } catch (error) {
    console.error(`[MAILGUN] ❌ Send failed: ${error.message}`);
    if (error.response?.status === 401) {
      console.error(`[MAILGUN]    ⚠️  API Key invalid or Domain incorrect`);
    } else if (error.response?.status === 400) {
      console.error(`[MAILGUN]    ⚠️  Bad request: ${error.response?.data?.message}`);
    }
    recordFailure(error);
    throw error;
  }
};

// ===========================
// OTP Email Template
// ===========================
export const sendOtpEmail = async (email, otp) => {
  console.log(`\n[OTP] 📧 REQUEST for ${email}`);

  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CU-Daters - Email Verification</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #d4536f 0%, #e8889f 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">CU-Daters</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Email Verification</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px; text-align: center;">
          <p style="font-size: 16px; color: #555; margin-bottom: 30px;">
            Your verification code is ready:
          </p>

          <!-- OTP Code Box -->
          <div style="background: #fff5f7; border: 2px solid #d4536f; border-radius: 10px; padding: 25px; margin: 30px 0;">
            <p style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">Verification Code</p>
            <p style="font-size: 48px; font-weight: 700; letter-spacing: 8px; color: #d4536f; margin: 0; font-family: 'Courier New', monospace; letter-spacing: 12px;">${otp}</p>
          </div>

          <!-- Instructions -->
          <div style="background: #f0f8ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 6px; font-size: 14px; color: #004687; text-align: left;">
            ⏰ <strong>Valid for 10 minutes only</strong><br>
            Enter this code in the CU-Daters app to verify your email
          </div>

          <!-- Security -->
          <p style="font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            Don't share this code. If you didn't request it, please ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999;">
          <p style="margin: 0;">© 2024 CU-Daters. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendViaMailgun(email, 'Your CU-Daters Email Verification Code', htmlTemplate);
    console.log(`[OTP] ✅ Sent to ${email}\n`);
  } catch (error) {
    console.error(`\n[OTP] ❌ FAILED for ${email}: ${error.message}\n`);
    throw error;
  }
};

// ===========================
// Password Reset Email
// ===========================
export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL || 'https://www.cudaters.tech'}/reset-password?token=${resetToken}`;

  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Password Reset - CU-Daters</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #d4536f 0%, #e8889f 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">CU-Daters</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px;">Password Reset</p>
        </div>
        <div style="padding: 40px 30px; text-align: center;">
          <p style="font-size: 16px; color: #555; margin-bottom: 30px;">
            Click the button below to reset your password:
          </p>
          <a href="${resetLink}" style="display: inline-block; background: #d4536f; color: white; padding: 12px 40px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            Reset Password
          </a>
          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            This link expires in 24 hours.<br>If you didn't request this, ignore this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendViaMailgun(email, 'Reset Your CU-Daters Password', htmlTemplate);
  } catch (error) {
    console.error(`[PASSWORD RESET] ❌ Failed for ${email}: ${error.message}`);
    throw error;
  }
};

// ===========================
// Registration Confirmation
// ===========================
export const sendRegistrationConfirmationEmail = async (email, userName) => {
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Welcome to CU-Daters</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #d4536f 0%, #e8889f 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to CU-Daters! 🎉</h1>
        </div>
        <div style="padding: 40px 30px; text-align: center;">
          <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
            Hi <strong>${userName}</strong>,
          </p>
          <p style="font-size: 14px; color: #666; margin-bottom: 30px;">
            Your account has been successfully created. Start connecting with other college students now!
          </p>
          <a href="https://www.cudaters.tech" style="display: inline-block; background: #d4536f; color: white; padding: 12px 40px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            Visit CU-Daters
          </a>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendViaMailgun(email, 'Welcome to CU-Daters!', htmlTemplate);
  } catch (error) {
    console.error(`[REGISTRATION] ❌ Failed for ${email}: ${error.message}`);
    throw error;
  }
};
