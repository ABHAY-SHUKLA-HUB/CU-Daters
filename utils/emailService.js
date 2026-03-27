import axios from 'axios';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ===== EMAIL SERVICE CONFIGURATION =====
const gmailUser = String(process.env.GMAIL_USER || '').trim();
const gmailPassword = String(process.env.GMAIL_PASSWORD || '').trim();
const mailgunApiKey = String(process.env.MAILGUN_API_KEY || '').trim();
const mailgunDomain = String(process.env.MAILGUN_DOMAIN || 'sandboxab3c5b29abb34e7a826f80de2fbe4e5a.mailgun.org').trim();

const useMailgun = Boolean(mailgunApiKey);
const useGmail = Boolean(gmailUser && gmailPassword);
const isConfigured = useMailgun || useGmail;

console.log('\n📧 EMAIL SERVICE initialized:');
console.log(`   - Gmail available: ${useGmail ? '✅' : '❌'}`);
console.log(`   - Mailgun available: ${useMailgun ? '✅' : '❌'}`);
console.log(`   - Active service: ${useMailgun ? 'Mailgun (HTTP - Render compatible)' : useGmail ? 'Gmail (SMTP - Local only)' : 'NONE'}\n`);

// Gmail transporter (for local development)
const gmailTransporter = useGmail ? nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user: gmailUser, pass: gmailPassword },
  connectionTimeout: 15000,
  socketTimeout: 15000
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

export const sendOtpEmail = async (email, otp) => {
  if (!isConfigured) throw new Error('Email service not configured');
  
  const subject = '🔐 Your CU-Daters Verification Code';
  const text = `Verification code: ${otp}\n\nValid for 10 minutes. Do not share.`;
  const html = `<h2>CU-Daters Verification</h2><p>Your code: <strong>${otp}</strong></p><p>Valid for 10 minutes</p>`;

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

  if (useMailgun) return sendViaMailgun(email, subject, text, html);
  if (useGmail) return gmailTransporter.sendMail({ from: gmailUser, to: email, subject, text, html });
  
  throw new Error('No email service configured');
};

export const sendRegistrationConfirmationEmail = async (email, userName) => {
  if (!isConfigured) throw new Error('Email service not configured');
  
  const subject = '✅ Welcome to CU-Daters!';
  const text = `Welcome ${userName}! Your account is now active.`;
  const html = `<h2>Welcome ${userName}!</h2><p>Your account is ready to use.</p>`;

  if (useMailgun) return sendViaMailgun(email, subject, text, html);
  if (useGmail) return gmailTransporter.sendMail({ from: gmailUser, to: email, subject, text, html });
  
  throw new Error('No email service configured');
};

export const sendApprovalEmail = async (email, userName) => {
  if (!isConfigured) throw new Error('Email service not configured');
  
  const subject = '✅ Your CU-Daters Profile Has Been Approved!';
  const text = `Hello ${userName},\n\nCongratulations! Your profile has been approved and is now live on CU-Daters.`;
  const html = `<h2>Profile Approved! 🎉</h2><p>Hello ${userName},</p><p>Your profile has been approved and is now visible to other users.</p>`;

  if (useMailgun) return sendViaMailgun(email, subject, text, html);
  if (useGmail) return gmailTransporter.sendMail({ from: gmailUser, to: email, subject, text, html });
  
  throw new Error('No email service configured');
};

export const sendRejectionEmail = async (email, userName, reason) => {
  if (!isConfigured) throw new Error('Email service not configured');
  
  const subject = '⚠️ Your CU-Daters Profile Needs Review';
  const text = `Hello ${userName},\n\nYour profile was not approved. Reason: ${reason || 'Please review our community guidelines.'}`;
  const html = `<h2>Profile Review Required</h2><p>Hello ${userName},</p><p>Your profile needs further review. ${reason || 'Please review our community guidelines.'}</p>`;

  if (useMailgun) return sendViaMailgun(email, subject, text, html);
  if (useGmail) return gmailTransporter.sendMail({ from: gmailUser, to: email, subject, text, html });
  
  throw new Error('No email service configured');
};

export const getEmailServiceHealth = () => ({
  configured: isConfigured,
  activeService: useMailgun ? 'Mailgun (HTTP)' : useGmail ? 'Gmail (SMTP)' : 'None',
  mailgunConfigured: useMailgun,
  gmailConfigured: useGmail,
  emailProvider: useMailgun ? mailgunDomain : useGmail ? gmailUser : 'Not configured'
});
