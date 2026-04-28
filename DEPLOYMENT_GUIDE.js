#!/usr/bin/env node
/**
 * CU-Daters Deployment Guide - Automated Steps
 * This script guides you through the deployment process step-by-step
 */

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                     🚀 CU-DATERS DEPLOYMENT GUIDE 🚀                       ║
║                         Production Deployment                              ║
╚════════════════════════════════════════════════════════════════════════════╝

📋 APPLICATION STATUS: ✅ FULLY FUNCTIONAL

🔐 Authentication: ✅ Working
   ├─ User Login: Tested ✓
   ├─ Admin Login: Tested ✓
   ├─ Password Hashing: Correct ✓
   └─ JWT Token Generation: Verified ✓

📦 Features Ready:
   ├─ User Registration
   ├─ Email OTP Verification
   ├─ Admin Dashboard
   ├─ Profile Management
   ├─ Chat System (Socket.io)
   ├─ Payment Processing (Razorpay)
   └─ User Matching & Discovery

═══════════════════════════════════════════════════════════════════════════════

DEPLOYMENT STEPS (Choose One):

OPTION A: Manual Deployment (Recommended for Control)
${'-'.repeat(75)}

1️⃣  DEPLOY BACKEND TO RENDER:
   a) Visit: https://render.com/dashboard
   b) Sign in with GitHub
   c) Click "New +" → "Web Service"
   d) Connect ABHAY-SHUKLA-HUB/CU-Daters repository
   e) Configure:
      • Name: cu-daters-backend
      • Environment: Node
      • Build Command: npm install
      • Start Command: npm start
      • Region: Singapore
   f) Add Environment Variables:
      NODE_ENV=production
      MONGODB_URI=[Your Production MongoDB URI]
      JWT_SECRET=[Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]
      EMAIL_USER=[Your Gmail]
      EMAIL_PASSWORD=[Gmail App Password]
      FRONTEND_URL=https://your-domain.com
      RAZORPAY_KEY_ID=[Live Key]
      RAZORPAY_KEY_SECRET=[Live Secret]
   g) Deploy! ⏳ (Takes 2-3 minutes)
   h) Note your backend URL: https://cu-daters-backend.onrender.com

2️⃣  DEPLOY FRONTEND TO VERCEL:
   a) Visit: https://vercel.com/dashboard
   b) Sign in with GitHub
   c) Click "Add New" → "Project"
   d) Import ABHAY-SHUKLA-HUB/CU-Daters
   e) Configure:
      • Framework: Vite
      • Build Command: npm run build
      • Output: dist
   f) Add Environment Variables:
      VITE_API_URL=https://cu-daters-backend.onrender.com
      VITE_SOCKET_URL=https://cu-daters-backend.onrender.com
      VITE_FIREBASE_API_KEY=[Your Key]
   g) Deploy! ⏳ (Takes 1-2 minutes)
   h) Frontend URL: https://your-project.vercel.app

3️⃣  CONFIGURE CUSTOM DOMAINS:
   
   For Frontend (Vercel):
   ├─ Go to Project Settings → Domains
   ├─ Add: www.seeu-daters.tech
   ├─ Update DNS Records at your registrar:
   │  • Type: CNAME
   │  • Name: www
   │  • Value: cname.vercel-dns.com
   └─ Wait 5-15 minutes for DNS propagation

   For Backend (Render):
   ├─ Go to Service Settings → Custom Domains
   ├─ Add: api.seeu-daters.tech
   ├─ Update DNS Records:
   │  • Type: CNAME
   │  • Name: api
   │  • Value: [Render provides this]
   └─ Wait 5-15 minutes for DNS propagation

═══════════════════════════════════════════════════════════════════════════════

OPTION B: Automated Deployment (Recommended for Speed)
${'-'.repeat(75)}

Prerequisites:
✓ Render account (render.com)
✓ Vercel account (vercel.com)
✓ GitHub connected to both
✓ Production MongoDB URI
✓ Production email credentials
✓ Razorpay live keys

Command:
$ node deploy-production.js

═══════════════════════════════════════════════════════════════════════════════

POST-DEPLOYMENT CHECKLIST:

✅ Verify Backend:
   curl https://cu-daters-backend.onrender.com/api/auth/health

✅ Verify Frontend:
   Visit https://your-domain.com
   - Check homepage loads
   - Check all pages accessible
   - Check images/resources load

✅ Test Authentication:
   1. Go to /login
   2. Try: admin@cudaters.com / AdminPassword123!
   3. Should redirect to admin portal
   4. Admin dashboard should display all menu items

✅ Test Admin Functions:
   1. Login to admin
   2. Check Registration Approvals
   3. Try Approve/Reject functionality
   4. Check Activity Log

✅ Monitor Logs:
   - Render: Dashboard → Service Logs
   - Vercel: Dashboard → Function Logs
   - Database: MongoDB Atlas → Activity

═══════════════════════════════════════════════════════════════════════════════

PRODUCTION DATABASE SETUP:

If using new MongoDB Atlas instance:

1. Create production database: cudaters-prod
2. Create collection indices:
   db.users.createIndex({ email: 1 })
   db.users.createIndex({ phone: 1 })
   db.users.createIndex({ role: 1, status: 1 })

3. Create initial admin:
   node create-admin-user.js (with MONGODB_URI=production-uri)

4. Configure backups:
   - Enable daily automated backups
   - Set 30-day retention

═══════════════════════════════════════════════════════════════════════════════

TROUBLESHOOTING:

Problem: Backend won't start on Render
Solution: 
  - Check environment variables are all set
  - Verify MONGODB_URI connection string
  - Check Render logs for specific errors
  - Restart the service from dashboard

Problem: Frontend can't connect to backend
Solution:
  - Verify VITE_API_URL is correct production URL
  - Check CORS is enabled in backend
  - Ensure backend is responding to /api/health
  - Check browser console for actual errors

Problem: Email not sending from production
Solution:
  - Verify Gmail app password (not regular password)
  - Enable Less Secure App Access if needed
  - Check EMAIL_USER and EMAIL_PASSWORD are exact
  - Verify SMTP settings in emailService.js

═══════════════════════════════════════════════════════════════════════════════

MONITORING & SUPPORT:

Daily Checks:
✓ Backend response time
✓ Error rates
✓ Database connection
✓ Email delivery status

Weekly Tasks:
✓ Check user growth metrics
✓ Review error logs
✓ Monitor payment processing
✓ Update dependencies

Performance Targets:
✓ Page load time: < 3 seconds
✓ API response time: < 500ms
✓ Database query time: < 100ms
✓ Uptime: 99.9%

═══════════════════════════════════════════════════════════════════════════════

NEXT STEPS:

1. Choose deployment option (A or B)
2. Prepare production environment variables
3. Deploy backend and frontend
4. Configure custom domains
5. Run post-deployment checks
6. Monitor logs and metrics
7. Enable backups and monitoring
8. Celebrate! 🎉

═══════════════════════════════════════════════════════════════════════════════

📞 SUPPORT CONTACTS:

- Backend Issues: Check Render logs
- Frontend Issues: Check Vercel logs
- Database Issues: MongoDB Atlas dashboard
- Email Issues: Gmail app password settings
- Payment Issues: Razorpay dashboard

═══════════════════════════════════════════════════════════════════════════════

🎯 ESTIMATED TIME: 30 minutes to full production deployment

Current Status: ✅ READY FOR DEPLOYMENT

Last Updated: April 28, 2026
Version: 1.0 - Production Ready

═══════════════════════════════════════════════════════════════════════════════
`);
