# 🚀 PRODUCTION DEPLOYMENT GUIDE - CU-Daters

## ✅ Pre-Deployment Checklist

### Environment Preparation
- [x] Merge conflicts resolved
- [x] All tests passing
- [x] Database configured (MongoDB Atlas)
- [x] Email service configured (Gmail SMTP)
- [x] Admin user created
- [x] Test users created

### Code Quality
- [x] No syntax errors
- [x] All routes working
- [x] Authentication system ready
- [x] Database models verified

---

## 📋 STEP 1: Prepare Environment Variables

### Update `.env` for Production

```bash
# Copy production keys from:
# - Render Dashboard → Environment
# - Vercel Settings → Environment Variables
# - Google Cloud Console → Credentials
# - Razorpay Dashboard → API Keys

# Critical Variables to Update:
1. MONGODB_URI → Your MongoDB Atlas production URI
2. JWT_SECRET → Generate new secure random string
3. EMAIL_USER / EMAIL_PASSWORD → Gmail app password
4. FIREBASE_* → Production Firebase credentials
5. RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET → Live keys
6. FRONTEND_URL → Your production domain
7. BACKEND_URL → Your backend production URL
```

### Generate Secure JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🌐 STEP 2: Deploy to Render (Backend)

### 2.1 Connect GitHub Repository
1. Go to [render.com](https://render.com)
2. Sign in with GitHub
3. Click "New +" → "Web Service"
4. Select `CU-Daters` repository
5. Configure:
   - **Name**: cu-daters-backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Region**: Singapore (or closest to users)
   - **Plan**: Free (for testing)

### 2.2 Set Environment Variables on Render
```
NODE_ENV=production
PORT=5000
MONGODB_URI=[production-mongodb-uri]
JWT_SECRET=[generated-secret]
EMAIL_USER=[gmail]
EMAIL_PASSWORD=[app-password]
FRONTEND_URL=https://your-production-domain.com
RAZORPAY_KEY_ID=[live-key]
RAZORPAY_KEY_SECRET=[live-secret]
```

### 2.3 Deploy
- Render auto-deploys on push to `main`
- Check [render.com/dashboard](https://render.com/dashboard) for logs
- Backend available at: `https://cu-daters-backend.onrender.com`

---

## 🎨 STEP 3: Deploy to Vercel (Frontend)

### 3.1 Connect Repository
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New" → "Project"
4. Import `CU-Daters` repository
5. Configure:
   - **Framework**: Vite
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3.2 Set Environment Variables
```
VITE_API_URL=https://cu-daters-backend.onrender.com
VITE_SOCKET_URL=https://cu-daters-backend.onrender.com
VITE_FIREBASE_API_KEY=[production-key]
VITE_FIREBASE_PROJECT_ID=[project-id]
```

### 3.3 Deploy
- Vercel auto-deploys on push to `main`
- Frontend available at: `https://cu-daters.vercel.app`

---

## 🔒 STEP 4: Configure Custom Domain (Optional)

### For Vercel Frontend
1. Go to Vercel Dashboard → Project Settings → Domains
2. Add custom domain: `www.seeu-daters.tech`
3. Update DNS records at domain registrar

### For Render Backend
1. Go to Render Dashboard → Service Settings → Custom Domain
2. Add domain: `api.seeu-daters.tech`
3. Update CORS in backend code

---

## ✅ STEP 5: Post-Deployment Setup

### 5.1 Verify Connectivity
```bash
# Test backend
curl https://cu-daters-backend.onrender.com/health

# Test API
curl https://cu-daters-backend.onrender.com/api/auth/health
```

### 5.2 Initialize Production Database
```bash
# Create admin user on production
node create-admin-user.js
```

### 5.3 Test Authentication Flow
1. Visit `https://your-domain.com/login`
2. Enter admin credentials
3. Verify JWT token generated
4. Check admin dashboard loads

### 5.4 Configure SSL/HTTPS
- ✅ Render: Auto-configured
- ✅ Vercel: Auto-configured
- Update `FRONTEND_URL` in Render environment

---

## 📊 STEP 6: Monitoring & Maintenance

### Enable Logging
```bash
# On Render Dashboard
- Real-time logs available
- Error tracking enabled
- Performance metrics tracked
```

### Database Backups
- MongoDB Atlas: Automated daily backups
- Point-in-time recovery: 7 days retention

### Health Checks
```bash
# Create monitoring script
- Check backend health every 5 min
- Alert on 3 consecutive failures
- Restart service if needed
```

---

## 🔧 TROUBLESHOOTING

### Issue: CORS Errors
**Solution**: Add production domain to `server.js` CORS whitelist

### Issue: Email Not Sending
**Solution**: Verify Gmail app password and enable 2FA

### Issue: Database Connection Failed
**Solution**: Whitelist Render IP in MongoDB Atlas → Network Access

### Issue: Frontend Can't Connect to Backend
**Solution**: Update `VITE_API_URL` in Vercel environment variables

---

## 📱 STEP 7: Mobile App Testing

### iOS Safari
```bash
1. Open https://your-domain.com in Safari
2. Tap Share → Add to Home Screen
3. Test all features as native app
```

### Android Chrome
```bash
1. Open https://your-domain.com in Chrome
2. Tap Menu → Install app
3. Test all features as native app
```

---

## 🎉 DEPLOYMENT COMPLETE!

### Live URLs
- **Frontend**: https://your-domain.com
- **Backend API**: https://api.your-domain.com
- **Admin Panel**: https://your-domain.com/admin

### Next Steps
1. Monitor logs for errors
2. Set up automated backups
3. Configure email alerts
4. Plan regular security audits
5. Monitor user growth and performance

---

## 📞 Support

For deployment issues:
1. Check Render logs: [render.com/dashboard](https://render.com/dashboard)
2. Check Vercel logs: [vercel.com/dashboard](https://vercel.com/dashboard)
3. Review backend output in terminal
4. Check browser console for frontend errors

**Status**: Ready for production deployment ✅
