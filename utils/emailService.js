import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// ===========================
// EMAIL SERVICE - SendGrid HTTP API
// ===========================
// Uses HTTPS REST API instead of SMTP
// ✅ No IPv4/IPv6 issues
// ✅ No network blocking
// ✅ Works reliably on Render & all platforms

const sendGridApiKey = String(process.env.SENDGRID_API_KEY || '').trim();
const sendGridFromEmail = String(process.env.SENDGRID_FROM_EMAIL || 'noreply@cudaters.tech').trim();
const hasSendGridConfig = Boolean(sendGridApiKey);

console.log('\n' + '='.repeat(80));
console.log('📧 EMAIL SERVICE CONFIGURATION');
console.log('='.repeat(80));
console.log(`SendGrid Configured: ${hasSendGridConfig ? '✅ YES' : '❌ NO'}`);
if (hasSendGridConfig) {
  console.log(`  Backend: SendGrid HTTPS API v3`);
  console.log(`  From Email: ${sendGridFromEmail}`);
  console.log(`  Endpoint: https://api.sendgrid.com/v3/mail/send`);
}
console.log('✅ HTTP/HTTPS - No SMTP/IPv6 blocking issues');
console.log('='.repeat(80) + '\n');

// Email health tracking
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
  emailHealth.lastErrorMessage = error?.message || 'Email send failed';
};

export const getEmailServiceHealth = () => ({
  configured: hasSendGridConfig,
  backend: 'sendgrid',
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
// SendGrid API Helper
// ===========================
const sendEmailViaSendGrid = async (to, subject, htmlContent) => {
  if (!hasSendGridConfig) {
    const err = new Error('SendGrid not configured - set SENDGRID_API_KEY in .env');
    recordFailure(err);
    throw err;
  }

  console.log(`[SENDGRID] Sending to ${to}...`);

  try {
    const response = await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
        personalizations: [
          {
            to: [{ email: to }],
            subject: subject
          }
        ],
        from: { email: sendGridFromEmail },
        content: [
          {
            type: 'text/html',
            value: htmlContent
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${sendGridApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000  // 30s HTTP timeout
      }
    );

    const messageId = response.headers['x-message-id'] || 'unknown';
    console.log(`[SENDGRID] ✅ Email sent successfully`);
    console.log(`[SENDGRID]    To: ${to}`);
    console.log(`[SENDGRID]    Message ID: ${messageId}`);
    recordSuccess();
    return { messageId, to, status: 'success' };
  } catch (error) {
    console.error(`[SENDGRID] ❌ Failed to send email`);
    console.error(`[SENDGRID]    Error: ${error.message}`);
    if (error.response?.status === 401) {
      console.error(`[SENDGRID]    ⚠️  API Key invalid or unauthorized`);
    } else if (error.response?.status === 400) {
      console.error(`[SENDGRID]    ⚠️  Bad request: ${JSON.stringify(error.response?.data)}`);
    }
    recordFailure(error);
    throw error;
  }
};

// ===========================
// OTP Email
// ===========================
export const sendOtpEmail = async (email, otp) => {
  console.log(`\n[📧 OTP EMAIL REQUEST] ${email}`);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
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
            Your verification code is ready. Use this code to verify your email address:
          </p>

          <!-- OTP Code Box -->
          <div style="background: #fff5f7; border: 2px solid #d4536f; border-radius: 10px; padding: 25px; margin: 30px 0;">
            <p style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">Your Code</p>
            <p style="font-size: 42px; font-weight: 700; letter-spacing: 8px; color: #d4536f; margin: 0; font-family: 'Courier New', monospace;">${otp}</p>
          </div>

          <!-- Expiry Warning -->
          <div style="background: #fff9e6; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 6px; font-size: 14px; color: #856404; text-align: left;">
            ⏰ <strong>Valid for 10 minutes only</strong> - This code will expire soon
          </div>

          <!-- Instructions -->
          <div style="background: #f0f8ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 6px; font-size: 14px; color: #004687; text-align: left;">
            📝 <strong>How to use:</strong> Enter this code in the verification field on CU-Daters to complete your signup
          </div>

          <!-- Security Note -->
          <p style="font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            If you didn't request this code, you can safely ignore this email. Do not share this code with anyone.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee;">
          <p style="margin: 0;">
            © 2024 CU-Daters. All rights reserved.<br>
            <a href="https://www.cudaters.tech" style="color: #d4536f; text-decoration: none;">www.cudaters.tech</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmailViaSendGrid(email, 'Your CU-Daters Email Verification Code', htmlContent);
    console.log(`[✅ OTP EMAIL SENT] ${email}`);
    return result;
  } catch (error) {
    console.error(`[❌ OTP EMAIL FAILED] ${email} - ${error.message}`);
    throw error;
  }
};

// ===========================
// Password Reset Email
// ===========================
export const sendPasswordResetEmail = async (email, resetToken) => {
  console.log(`\n[📧 PASSWORD RESET EMAIL REQUEST] ${email}`);

  const resetLink = `${process.env.FRONTEND_URL || 'https://www.cudaters.tech'}/reset-password?token=${resetToken}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CU-Daters - Password Reset</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="background: linear-gradient(135deg, #d4536f 0%, #e8889f 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">CU-Daters</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Password Reset</p>
        </div>
        <div style="padding: 40px 30px; text-align: center;">
          <p style="font-size: 16px; color: #555; margin-bottom: 30px;">
            Click the button below to reset your password:
          </p>
          <a href="${resetLink}" style="display: inline-block; background: #d4536f; color: white; padding: 12px 40px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0;">
            Reset Password
          </a>
          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            This link expires in 24 hours. If you didn't request this, ignore this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmailViaSendGrid(email, 'Reset Your CU-Daters Password', htmlContent);
    console.log(`[✅ PASSWORD RESET EMAIL SENT] ${email}`);
    return result;
  } catch (error) {
    console.error(`[❌ PASSWORD RESET EMAIL FAILED] ${email} - ${error.message}`);
    throw error;
  }
};

// ===========================
// Registration Confirmation Email
// ===========================
export const sendRegistrationConfirmationEmail = async (email, userName) => {
  console.log(`\n[📧 REGISTRATION CONFIRMATION EMAIL REQUEST] ${email}`);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CU-Daters - Welcome</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="background: linear-gradient(135deg, #d4536f 0%, #e8889f 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Welcome to CU-Daters!</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Your account is ready</p>
        </div>
        <div style="padding: 40px 30px; text-align: center;">
          <p style="font-size: 16px; color: #555; margin-bottom: 20px;">
            Hi <strong>${userName}</strong>, welcome to CU-Daters! 🎉
          </p>
          <p style="font-size: 14px; color: #666; margin-bottom: 30px;">
            Your account has been successfully created. You can now start exploring and connecting with other college students.
          </p>
          <a href="https://www.cudaters.tech" style="display: inline-block; background: #d4536f; color: white; padding: 12px 40px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 20px 0;">
            Get Started
          </a>
          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            Thank you for joining CU-Daters!
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmailViaSendGrid(email, 'Welcome to CU-Daters!', htmlContent);
    console.log(`[✅ REGISTRATION EMAIL SENT] ${email}`);
    return result;
  } catch (error) {
    console.error(`[❌ REGISTRATION EMAIL FAILED] ${email} - ${error.message}`);
    throw error;
  }
};
