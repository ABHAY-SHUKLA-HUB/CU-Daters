import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ===========================
// EMAIL SERVICE - Gmail SMTP
// ===========================

const gmailUser = String(process.env.GMAIL_USER || '').trim();
const gmailPassword = String(process.env.GMAIL_PASSWORD || '').trim();
const hasGmailConfig = Boolean(gmailUser && gmailPassword);

console.log('\n' + '='.repeat(80));
console.log('📧 EMAIL SERVICE - GMAIL SMTP');
console.log('='.repeat(80));
console.log(`Configured: ${hasGmailConfig ? '✅ YES' : '❌ NO'}`);
if (hasGmailConfig) {
  console.log(`From: ${gmailUser}`);
  console.log(`Timeouts: 60s connection, 60s socket`);
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
  configured: hasGmailConfig,
  backend: 'gmail',
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
// Gmail Transporter
// ===========================
const gmailTransporter = hasGmailConfig ? nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: gmailUser,
    pass: gmailPassword
  },
  logger: false,
  debug: false,
  // IMPORTANT: Long timeouts for slow networks (Render, etc)
  connectionTimeout: 60000,  // 60s for connection
  socketTimeout: 60000        // 60s for socket operations
}) : null;

// ===========================
// Send Email via Gmail
// ===========================
const sendViaGmail = async (mailOptions) => {
  if (!gmailTransporter) {
    throw new Error('Gmail not configured - set GMAIL_USER and GMAIL_PASSWORD');
  }

  console.log(`[GMAIL] 📧 Sending to ${mailOptions.to}...`);

  return new Promise((resolve, reject) => {
    // NO timeout here - let nodemailer handle it with 60s configured above
    gmailTransporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(`[GMAIL] ❌ Send failed:`, error.message);
        console.error(`[GMAIL]    Code: ${error.code}`);
        recordFailure(error);
        reject(error);
      } else {
        console.log(`[GMAIL] ✅ Email sent successfully`);
        console.log(`[GMAIL]    Message ID: ${info.messageId}`);
        console.log(`[GMAIL]    To: ${mailOptions.to}`);
        recordSuccess();
        resolve(info);
      }
    });
  });
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
    await sendViaGmail({
      from: gmailUser,
      to: email,
      subject: 'Your CU-Daters Email Verification Code',
      html: htmlTemplate,
      text: `Your CU-Daters verification code is: ${otp}\n\nThis code is valid for 10 minutes.\n\nDo not share this code with anyone.`
    });
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
    await sendViaGmail({
      from: gmailUser,
      to: email,
      subject: 'Reset Your CU-Daters Password',
      html: htmlTemplate
    });
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
    await sendViaGmail({
      from: gmailUser,
      to: email,
      subject: 'Welcome to CU-Daters!',
      html: htmlTemplate
    });
  } catch (error) {
    console.error(`[REGISTRATION] ❌ Failed for ${email}: ${error.message}`);
    throw error;
  }
};
