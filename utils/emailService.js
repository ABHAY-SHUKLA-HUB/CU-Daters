import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// ===========================
// EMAIL SERVICE - Mailgun HTTP API
// ===========================
// Uses Mailgun REST API (HTTPS)
// ✅ No IPv4/IPv6 network issues
// ✅ Free tier: 300 emails/month
// ✅ Rock-solid reliability

const mailgunApiKey = String(process.env.MAILGUN_API_KEY || '').trim();
const mailgunDomain = String(process.env.MAILGUN_DOMAIN || '').trim();
const mailgunFromEmail = String(process.env.MAILGUN_FROM_EMAIL || 'noreply@cudaters.tech').trim();
const hasMailgunConfig = Boolean(mailgunApiKey && mailgunDomain);

console.log('\n' + '='.repeat(80));
console.log('📧 EMAIL SERVICE CONFIGURATION');
console.log('='.repeat(80));
console.log(`Mailgun Configured: ${hasMailgunConfig ? '✅ YES' : '❌ NO'}`);
if (hasMailgunConfig) {
  console.log(`  Backend: Mailgun HTTPS REST API`);
  console.log(`  Domain: ${mailgunDomain}`);
  console.log(`  From Email: ${mailgunFromEmail}`);
  console.log(`  Free Tier: 300 emails/month`);
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
// Mailgun API Helper
// ===========================
const sendEmailViaMailgun = async (to, subject, htmlContent) => {
  if (!hasMailgunConfig) {
    const err = new Error('Mailgun not configured - set MAILGUN_API_KEY and MAILGUN_DOMAIN in .env');
    recordFailure(err);
    throw err;
  }

  console.log(`[MAILGUN] Sending to ${to}...`);

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
    console.log(`[MAILGUN]    To: ${to}`);
    console.log(`[MAILGUN]    Message ID: ${messageId}`);
    recordSuccess();
    return { messageId, to, status: 'success' };
  } catch (error) {
    console.error(`[MAILGUN] ❌ Failed to send email`);
    console.error(`[MAILGUN]    Error: ${error.message}`);
    if (error.response?.status === 401) {
      console.error(`[MAILGUN]    ⚠️  API Key or Domain invalid`);
    } else if (error.response?.status === 400) {
      console.error(`[MAILGUN]    ⚠️  Bad request: ${error.response?.data?.message}`);
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
    const result = await sendEmailViaMailgun(email, 'Your CU-Daters Email Verification Code', htmlContent);
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
    const result = await sendEmailViaMailgun(email, 'Reset Your CU-Daters Password', htmlContent);
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
    const result = await sendEmailViaMailgun(email, 'Welcome to CU-Daters!', htmlContent);
    console.log(`[✅ REGISTRATION EMAIL SENT] ${email}`);
    return result;
  } catch (error) {
    console.error(`[❌ REGISTRATION EMAIL FAILED] ${email} - ${error.message}`);
    throw error;
  }
};
