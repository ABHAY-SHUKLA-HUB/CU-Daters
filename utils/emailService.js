import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ===========================
// EMAIL SERVICE - Gmail SMTP
// ===========================
// Uses your personal Gmail account via SMTP
// App Password required (not regular Gmail password)

const gmailUser = String(process.env.GMAIL_USER || '').trim();
const gmailPassword = String(process.env.GMAIL_PASSWORD || '').trim();
const hasGmailConfig = Boolean(gmailUser && gmailPassword);

console.log('\n' + '='.repeat(80));
console.log('📧 EMAIL SERVICE - GMAIL SMTP');
console.log('='.repeat(80));
console.log(`Configured: ${hasGmailConfig ? '✅ YES' : '❌ NO'}`);
if (hasGmailConfig) {
  console.log(`From: ${gmailUser}`);
  console.log(`Status: Ready to send emails`);
}
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
  emailHealth.lastErrorMessage = error?.message || 'Unknown error';
};

export const getEmailServiceHealth = () => ({
  configured: hasGmailConfig,
  backend: 'gmail-smtp',
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

// Gmail transporter
const gmailTransporter = hasGmailConfig ? nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailUser,
    pass: gmailPassword
  },
  logger: false,
  debug: false
}) : null;

const sendViaGmail = (mailOptions) => {
  if (!gmailTransporter) {
    throw new Error('Gmail not configured - set GMAIL_USER and GMAIL_PASSWORD');
  }

  console.log(`[GMAIL] 📧 Sending to ${mailOptions.to}...`);

  return new Promise((resolve, reject) => {
    gmailTransporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(`[GMAIL] ❌ Failed:`, error.message);
        recordFailure(error);
        reject(error);
      } else {
        console.log(`[GMAIL] ✅ Sent to ${mailOptions.to}`);
        console.log(`[GMAIL]    Message ID: ${info.messageId}`);
        recordSuccess();
        resolve(info);
      }
    });
  });
};

// OTP Email
export const sendOtpEmail = async (email, otp) => {
  console.log(`\n[OTP] Sending to ${email}`);

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
            <p style="font-size: 48px; font-weight: 700; letter-spacing: 12px; color: #d4536f; margin: 0; font-family: 'Courier New', monospace;">${otp}</p>
          </div>

          <!-- Instructions -->
          <div style="background: #f0f8ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 6px; font-size: 14px; color: #004687; text-align: left;">
            ⏰ <strong>Valid for 10 minutes only</strong><br>
            Enter this code in CU-Daters to verify your email
          </div>

          <p style="font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            If you didn't request this, please ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999;">
          <p style="margin: 0;">© 2024 CU-Daters</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendViaGmail({
      from: gmailUser,
      to: email,
      subject: 'Your CU-Daters Verification Code',
      html: htmlTemplate,
      text: `Verification code: ${otp}\n\nValid for 10 minutes. Do not share this code.`
    });
    console.log(`[OTP] ✅ Email sent\n`);
  } catch (error) {
    console.error(`[OTP] ❌ Failed: ${error.message}\n`);
    throw error;
  }
};

// Password Reset Email
export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL || 'https://www.cudaters.tech'}/reset-password?token=${resetToken}`;

  try {
    await sendViaGmail({
      from: gmailUser,
      to: email,
      subject: 'Reset Your CU-Daters Password',
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p><p>This link expires in 24 hours.</p>`,
      text: `Reset password: ${resetLink}`
    });
  } catch (error) {
    console.error(`[PASSWORD RESET] Failed: ${error.message}`);
    throw error;
  }
};

// Registration Confirmation
export const sendRegistrationConfirmationEmail = async (email, userName) => {
  try {
    await sendViaGmail({
      from: gmailUser,
      to: email,
      subject: 'Welcome to CU-Daters!',
      html: `<h1>Welcome ${userName}!</h1><p>Your account has been created successfully.</p>`,
      text: `Welcome ${userName}! Your account has been created.`
    });
  } catch (error) {
    console.error(`[REGISTRATION] Failed: ${error.message}`);
    throw error;
  }
};
