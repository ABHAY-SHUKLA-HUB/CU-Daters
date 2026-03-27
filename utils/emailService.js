import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const gmailUser = String(process.env.GMAIL_USER || '').trim();
const gmailPassword = String(process.env.GMAIL_PASSWORD || '').trim();
const isConfigured = Boolean(gmailUser && gmailPassword);

console.log('\n📧 EMAIL SERVICE initialized -', isConfigured ? '✅ Gmail ready' : '❌ Not configured\n');

const transporter = isConfigured ? nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user: gmailUser, pass: gmailPassword },
  connectionTimeout: 15000,
  socketTimeout: 15000
}) : null;

export const sendOtpEmail = async (email, otp) => {
  if (!transporter) throw new Error('Email service not configured');
  return transporter.sendMail({
    from: gmailUser,
    to: email,
    subject: '🔐 Your CU-Daters Verification Code',
    text: `Verification code: ${otp}\n\nValid for 10 minutes. Do not share.`,
    html: `<p>Your code: <strong>${otp}</strong></p><p>Valid for 10 minutes</p>`
  });
};

export const sendPasswordResetEmail = async (email, resetToken) => {
  if (!transporter) throw new Error('Email service not configured');
  const resetLink = `${process.env.FRONTEND_URL || 'https://www.cudaters.tech'}/reset-password?token=${resetToken}`;
  return transporter.sendMail({
    from: gmailUser,
    to: email,
    subject: '🔐 Reset Your CU-Daters Password',
    text: `Click here to reset: ${resetLink}`,
    html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`
  });
};

export const sendRegistrationConfirmationEmail = async (email, userName) => {
  if (!transporter) throw new Error('Email service not configured');
  return transporter.sendMail({
    from: gmailUser,
    to: email,
    subject: '✅ Welcome to CU-Daters!',
    text: `Welcome ${userName}! Your account is now active.`,
    html: `<h2>Welcome ${userName}!</h2><p>Your account is ready to use.</p>`
  });
};

export const sendApprovalEmail = async (email, userName) => {
  if (!transporter) throw new Error('Email service not configured');
  return transporter.sendMail({
    from: gmailUser,
    to: email,
    subject: '✅ Your CU-Daters Profile Has Been Approved!',
    text: `Hello ${userName},\n\nCongratulations! Your profile has been approved and is now live on CU-Daters.`,
    html: `<h2>Profile Approved! 🎉</h2><p>Hello ${userName},</p><p>Your profile has been approved and is now visible to other users.</p>`
  });
};

export const sendRejectionEmail = async (email, userName, reason) => {
  if (!transporter) throw new Error('Email service not configured');
  return transporter.sendMail({
    from: gmailUser,
    to: email,
    subject: '⚠️ Your CU-Daters Profile Needs Review',
    text: `Hello ${userName},\n\nYour profile was not approved. Reason: ${reason || 'Please review our community guidelines.'}`,
    html: `<h2>Profile Review Required</h2><p>Hello ${userName},</p><p>Your profile needs further review. ${reason || 'Please review our community guidelines.'}</p>`
  });
};

export const getEmailServiceHealth = () => ({
  configured: isConfigured,
  backend: 'gmail-465',
  user: gmailUser || 'not set'
});