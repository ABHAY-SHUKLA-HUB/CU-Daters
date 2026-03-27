#!/usr/bin/env node

import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

console.log('\n');
console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║        PRODUCTION ENVIRONMENT DIAGNOSTIC REPORT               ║');
console.log('║                  CU-Daters Backend                            ║');
console.log('╚═══════════════════════════════════════════════════════════════╝');
console.log('');

// ===== SECTION 1: ENVIRONMENT CHECK =====
console.log('📋 1️⃣  ENVIRONMENT VARIABLES');
console.log('─────────────────────────────────────────────────────────────────');
const envVars = {
  'NODE_ENV': process.env.NODE_ENV || 'NOT SET (⚠️)',
  'PORT': process.env.PORT || '5000',
  'FRONTEND_URL': process.env.FRONTEND_URL || 'NOT SET',
  'FRONTEND_PUBLIC_URL': process.env.FRONTEND_PUBLIC_URL || 'NOT SET',
  'BACKEND_URL': process.env.BACKEND_URL || 'NOT SET',
  'MONGODB_URI': process.env.MONGODB_URI ? '✅ CONFIGURED' : '❌ MISSING',
  'JWT_SECRET': process.env.JWT_SECRET ? '✅ CONFIGURED' : '❌ MISSING',
  'EMAIL_USER': process.env.EMAIL_USER || '❌ MISSING',
  'EMAIL_PASSWORD': process.env.EMAIL_PASSWORD ? '✅ CONFIGURED' : '❌ MISSING',
  'CORS_ORIGIN': process.env.CORS_ORIGIN || 'NOT SET',
  'CORS_ALLOWED_ORIGINS': process.env.CORS_ALLOWED_ORIGINS || 'NOT SET',
};

Object.entries(envVars).forEach(([key, value]) => {
  const isError = value.includes('❌') || value.includes('NOT SET');
  const icon = isError ? '❌' : '✅';
  console.log(`  ${icon} ${key.padEnd(25)} ${value}`);
});
console.log('');

// ===== SECTION 2: CORS DEBUGGING =====
console.log('🔐 2️⃣  CORS CONFIGURATION ANALYSIS');
console.log('─────────────────────────────────────────────────────────────────');

const parseOriginList = (rawValue) => {
  if (!rawValue || typeof rawValue !== 'string') return [];
  return rawValue
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
};

const corsOriginRaw = process.env.CORS_ORIGIN || '';
const corsAllowedOriginsRaw = process.env.CORS_ALLOWED_ORIGINS || '';

console.log(`  Raw CORS_ORIGIN value: "${corsOriginRaw}"`);
if (corsOriginRaw.includes('=')) {
  console.log(`  ⚠️  WARNING: CORS_ORIGIN contains '=' - looks malformed!`);
  console.log(`      Should NOT include key name. Remove: CORS_ALLOWED_ORIGINS=`);
}

const corsOrigins = parseOriginList(corsOriginRaw);
const corsAllowedOrigins = parseOriginList(corsAllowedOriginsRaw);
const allCorsOrigins = [...corsOrigins, ...corsAllowedOrigins].filter(Boolean);

console.log(`  Parsed CORS origins: ${allCorsOrigins.length || 'NONE'}`);
allCorsOrigins.forEach((origin) => {
  console.log(`    • ${origin}`);
});

if (allCorsOrigins.length === 0) {
  console.log(`  ⚠️  WARNING: No CORS origins parsed! Fallback to hardcoded list.`);
}

console.log(`  Frontend domain: https://www.cudaters.tech`);
console.log(`  Is www.cudaters.tech in the list? ${allCorsOrigins.includes('https://www.cudaters.tech') ? '✅ YES' : '❌ NO'}`);
console.log('');

// ===== SECTION 3: EMAIL SERVICE CHECK =====
console.log('📧 3️⃣  EMAIL SERVICE CONFIGURATION');
console.log('─────────────────────────────────────────────────────────────────');

const emailUser = String(process.env.EMAIL_USER || '').trim();
const emailPassword = String(process.env.EMAIL_PASSWORD || '').replace(/\s+/g, '');
const smtpHost = String(process.env.SMTP_HOST || 'smtp.gmail.com').trim();
const smtpPort = Number(process.env.SMTP_PORT || 587);
const hasSmtpCredentials = Boolean(emailUser && emailPassword);

console.log(`  SMTP Host: ${smtpHost}`);
console.log(`  SMTP Port: ${smtpPort}`);
console.log(`  Email User: ${emailUser || '❌ MISSING'}`);
console.log(`  Email Password: ${emailPassword ? `✅ Configured (${emailPassword.length} chars)` : '❌ MISSING'}`);
console.log(`  Has SMTP Credentials: ${hasSmtpCredentials ? '✅ YES' : '❌ NO'}`);

if (hasSmtpCredentials) {
  console.log('\n  🧪 Testing SMTP Connection...');
  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
      logger: false,
      debug: false,
    });

    transporter.verify((error, success) => {
      if (error) {
        console.log(`     ❌ SMTP Connection FAILED`);
        console.log(`     Error: ${error.message}`);
        console.log(`     Code: ${error.code}`);
      } else {
        console.log(`     ✅ SMTP Connection SUCCESSFUL`);
        console.log(`     Ready to send emails`);
      }
    });
  } catch (error) {
    console.log(`     ❌ Exception during SMTP test: ${error.message}`);
  }
} else {
  console.log('     ❌ Cannot test: missing SMTP credentials');
}

console.log('');

// ===== SECTION 4: DATABASE CHECK =====
console.log('🗄️  4️⃣  DATABASE CONFIGURATION');
console.log('─────────────────────────────────────────────────────────────────');

const mongoUri = process.env.MONGODB_URI || '';
const hasMongoUri = Boolean(mongoUri && mongoUri.includes('mongodb'));

console.log(`  MongoDB URI: ${hasMongoUri ? '✅ Configured' : '❌ MISSING'}`);
if (mongoUri) {
  const sanitized = mongoUri.replace(/:[^:]*@/, ':***@');
  console.log(`  Details: ${sanitized.substring(0, 80)}...`);
}

console.log('');

// ===== SECTION 5: FIXES REQUIRED =====
console.log('🔧 5️⃣  REQUIRED FIXES');
console.log('─────────────────────────────────────────────────────────────────');

const issues = [];

if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
  issues.push({
    severity: '🔴 CRITICAL',
    issue: 'NODE_ENV not set to "production" on Render',
    fix: 'Add NODE_ENV=production to Render environment variables',
  });
}

if (corsOriginRaw.includes('=')) {
  issues.push({
    severity: '🔴 CRITICAL',
    issue: 'CORS_ORIGIN value is malformed',
    fix: `Change from: "${corsOriginRaw}"
    To: "https://www.cudaters.tech,https://cudaters.tech,http://localhost:5173"`,
  });
}

if (!emailUser || !emailPassword) {
  issues.push({
    severity: '🔴 CRITICAL',
    issue: 'Email credentials missing or incomplete',
    fix: 'Verify EMAIL_USER and EMAIL_PASSWORD are set on Render',
  });
}

if (!process.env.MONGODB_URI) {
  issues.push({
    severity: '🔴 CRITICAL',
    issue: 'MongoDB URI not configured',
    fix: 'Add MONGODB_URI to Render environment variables',
  });
}

if (issues.length === 0) {
  console.log('  ✅ No critical issues found!');
} else {
  issues.forEach((item, index) => {
    console.log(`  ${item.severity} Issue #${index + 1}: ${item.issue}`);
    console.log(`  Fix: ${item.fix}`);
    console.log('');
  });
}

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║                    END OF DIAGNOSTIC REPORT                   ║');
console.log('╚═══════════════════════════════════════════════════════════════╝');
console.log('');
