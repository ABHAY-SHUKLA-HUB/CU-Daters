import axios from 'axios';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ===== EMAIL SERVICE CONFIGURATION =====
// Support multiple variable name conventions
const smtpHost = String(
  process.env.SMTP_HOST || 
  process.env.EMAIL_HOST || 
  'smtp.gmail.com'
).trim();

const gmailUser = String(
  process.env.GMAIL_USER || 
  process.env.EMAIL_USER || 
  process.env.SMTP_USER || ''
).trim();

const gmailPassword = String(
  process.env.GMAIL_PASSWORD || 
  process.env.EMAIL_PASSWORD || 
  process.env.SMTP_PASSWORD || ''
).trim();

const mailgunApiKey = String(
  process.env.MAILGUN_API_KEY || 
  process.env.SENDGRID_API_KEY || ''
).trim();

const mailgunDomain = String(
  process.env.MAILGUN_DOMAIN || ''
).trim();

const resendApiKey = String(
  process.env.RESEND_API_KEY || ''
).trim();

const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);

const useMailgun = Boolean(mailgunApiKey);
const useGmail = Boolean(gmailUser && gmailPassword);
const useResend = Boolean(resendApiKey);
const isConfigured = useMailgun || useGmail || useResend;

console.log('\n📧 EMAIL SERVICE initialized:');
console.log(`   - SMTP available: ${useGmail ? '✅' : '❌'}`);
console.log(`   - HTTP API available: ${useMailgun || useResend ? '✅' : '❌'}`);
console.log(`   - Active service: ${useResend ? 'HTTP API (Resend)' : useMailgun ? 'HTTP API (Mailgun/SendGrid)' : useGmail ? `SMTP (${smtpHost}:${smtpPort})` : '❌ NOT CONFIGURED'}\n`);
if (!isConfigured) {
  console.log(`   ⚠️  Set one of these on Render:\n`);
  console.log(`   OPTION A - Resend (RECOMMENDED for Render):`);
  console.log(`      • RESEND_API_KEY=re_xxxxx\n`);
  console.log(`   OPTION B - HTTP API (Mailgun/SendGrid):`);
  console.log(`      • MAILGUN_API_KEY or SENDGRID_API_KEY`);
  console.log(`      • MAILGUN_DOMAIN (if using Mailgun)\n`);
  console.log(`   OPTION C - SMTP (Local development only):`);
  console.log(`      • EMAIL_USER or GMAIL_USER`);
  console.log(`      • EMAIL_PASSWORD or GMAIL_PASSWORD`);
  console.log(`      • SMTP_HOST (default: smtp.gmail.com)`);
  console.log(`      • SMTP_PORT (default: 465)\n`);
}

// SMTP or Gmail transporter (for local development or Render with SMTP)
const gmailTransporter = useGmail ? nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: { user: gmailUser, pass: gmailPassword },
  connectionTimeout: 30000,
  socketTimeout: 30000
}) : null;

// ===== Mailgun HTTP API Helper =====
const sendViaMailgun = async (to, subject, text, html) => {
  const auth = Buffer.from(`api:${mailgunApiKey}`).toString('base64');
  const data = new URLSearchParams();
  data.append('from', `noreply@${mailgunDomain}`);
  data.append('to', to);
  data.append('subject', subject);
  data.append('text', text);
  data.append('html', html);

  const response = await axios.post(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, data, {
    headers: { Authorization: `Basic ${auth}` }
  });
  return response.data;
};

// ===== Resend HTTP API Helper =====
const sendViaResend = async (to, subject, text, html) => {
  const response = await axios.post('https://api.resend.com/emails', {
    from: 'CU-Daters <onboarding@resend.dev>',
    to: to,
    subject: subject,
    html: html,
    text: text
  }, {
    headers: { Authorization: `Bearer ${resendApiKey}` }
  });
  return response.data;
};

export const sendOtpEmail = async (email, otp) => {
  if (!isConfigured) throw new Error('Email service not configured');
  
  const subject = '🔐 Your CU-Daters Verification Code';
  const text = `Verification code: ${otp}\n\nValid for 10 minutes. Do not share.`;
  const html = `<h2>CU-Daters Verification</h2><p>Your code: <strong>${otp}</strong></p><p>Valid for 10 minutes</p>`;

  if (useResend) return sendViaResend(email, subject, text, html);
  if (useMailgun) return sendViaMailgun(email, subject, text, html);
  if (useGmail) return gmailTransporter.sendMail({ from: gmailUser, to: email, subject, text, html });
  
  throw new Error('No email service configured');
};

export const sendPasswordResetEmail = async (email, resetToken) => {
  if (!isConfigured) throw new Error('Email service not configured');
  
  const resetLink = `${process.env.FRONTEND_URL || 'https://www.cudaters.tech'}/reset-password?token=${resetToken}`;
  const subject = '🔐 Reset Your CU-Daters Password';
  const text = `Click here to reset: ${resetLink}`;
  const html = `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`;

  if (useResend) return sendViaResend(email, subject, text, html);
  if (useMailgun) return sendViaMailgun(email, subject, text, html);
  if (useGmail) return gmailTransporter.sendMail({ from: gmailUser, to: email, subject, text, html });
  
  throw new Error('No email service configured');
};

export const sendRegistrationConfirmationEmail = async (email, userName) => {
  if (!isConfigured) throw new Error('Email service not configured');
  
  const subject = '✅ Welcome to CU-Daters!';
  const text = `Welcome ${userName}! Your account is now active.`;
  const html = `<h2>Welcome ${userName}!</h2><p>Your account is ready to use.</p>`;

  if (useResend) return sendViaResend(email, subject, text, html);
  if (useMailgun) return sendViaMailgun(email, subject, text, html);
  if (useGmail) return gmailTransporter.sendMail({ from: gmailUser, to: email, subject, text, html });
  
  throw new Error('No email service configured');
};

export const sendApprovalEmail = async (email, userName) => {
  if (!isConfigured) throw new Error('Email service not configured');
  
  const subject = '✅ Your CU-Daters Profile Has Been Approved!';
  const text = `Hello ${userName},\n\nCongratulations! Your profile has been approved and is now live on CU-Daters.`;
  const html = `<h2>Profile Approved! 🎉</h2><p>Hello ${userName},</p><p>Your profile has been approved and is now visible to other users.</p>`;

  if (useResend) return sendViaResend(email, subject, text, html);
  if (useMailgun) return sendViaMailgun(email, subject, text, html);
  if (useGmail) return gmailTransporter.sendMail({ from: gmailUser, to: email, subject, text, html });
  
  throw new Error('No email service configured');
};

export const sendRejectionEmail = async (email, userName, reason) => {
  if (!isConfigured) throw new Error('Email service not configured');
  
  const subject = '⚠️ Your CU-Daters Profile Needs Review';
  const text = `Hello ${userName},\n\nYour profile was not approved. Reason: ${reason || 'Please review our community guidelines.'}`;
  const html = `<h2>Profile Review Required</h2><p>Hello ${userName},</p><p>Your profile needs further review. ${reason || 'Please review our community guidelines.'}</p>`;

  if (useResend) return sendViaResend(email, subject, text, html);
  if (useMailgun) return sendViaMailgun(email, subject, text, html);
  if (useGmail) return gmailTransporter.sendMail({ from: gmailUser, to: email, subject, text, html });
  
  throw new Error('No email service configured');
};

export const getEmailServiceHealth = () => ({
  configured: isConfigured,
  activeService: useResend ? 'Resend (HTTP)' : useMailgun ? 'Mailgun (HTTP)' : useGmail ? 'Gmail (SMTP)' : 'None',
  resendConfigured: useResend,
  mailgunConfigured: useMailgun,
  gmailConfigured: useGmail,
  emailProvider: useMailgun ? mailgunDomain : useGmail ? gmailUser : 'Not configured'
});
