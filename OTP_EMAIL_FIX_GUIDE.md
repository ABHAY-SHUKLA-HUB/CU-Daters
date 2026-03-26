# 📧 OTP Email Fix Guide - CU-Daters

## Problem Identified ❌

**Root Cause:** The `.env` file was missing, so Gmail SMTP credentials were not configured. The emailService.js code is correct, but without credentials, OTP emails cannot be sent.

## Solution Overview ✅

Your email service has 3 operational modes:
1. **Development Mode** (console) - shows OTP in backend logs (when no credentials set)
2. **SMTP Mode** (Gmail) - sends real emails via Gmail SMTP
3. **Resend Mode** (fallback) - uses Resend API if SMTP fails

Now let's enable SMTP mode by configuring Gmail credentials.

---

## Step 1: Enable 2-Factor Authentication (REQUIRED)

**This is mandatory.** Gmail app passwords only work if 2FA is enabled.

1. Open: **myaccount.google.com/security**
2. In the left menu, find **"2-Step Verification"**
3. Click it and follow Google's setup process (usually phone verification)
4. Once enabled, you'll see a checkmark next to "2-Step Verification"

⏱️ **Time needed:** 2-3 minutes

---

## Step 2: Generate Gmail App Password

**This creates a special password for your app that's separate from your account password.**

1. Go to: **myaccount.google.com/apppasswords**
2. If you see "App passwords" option:
   - Select: **"Mail"** (in first dropdown)
   - Select: **"Windows Computer"** (in second dropdown, or your device type)
   - Click **"Generate"**
3. **COPY the 16-character password** shown in the popup
   - Example format: `abcd efgh ijkl mnop` (with spaces)
   - **DO NOT copy with spaces**

⏱️ **Time needed:** 1 minute

---

## Step 3: Update Your .env File

**The `.env` file has been created at:** `CU-Daters/.env`

Open it and find these lines:

```env
# ⚠️  CRITICAL: Update these with YOUR Gmail credentials
EMAIL_USER=replace_with_your_gmail@gmail.com
EMAIL_PASSWORD=replace_with_16char_app_password
```

Replace with:
- **EMAIL_USER:** Your Gmail address (e.g., `yourname@gmail.com`)
- **EMAIL_PASSWORD:** The 16-character app password (without spaces)

**Example:**
```env
EMAIL_USER=john.smith@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
```

✅ Save the file.

---

## Step 4: Verify Configuration

### Option A: Run SMTP Connection Test (Recommended)

```powershell
# In your CU-Daters folder, run:
node test-gmail-smtp.js
```

**Expected output:**
```
✅ EMAIL_USER configured: john.smith@gmail.com
✅ EMAIL_PASSWORD set: 16 characters
✅ SMTP_HOST: smtp.gmail.com
✅ SMTP_PORT: 587
✅ SMTP_SECURE: false

✅ SMTP Connection Successful! 
   Gmail SMTP Connection Verified!
   OTP emails will be sent via Gmail SMTP
```

If you get an error, see **Troubleshooting** section below.

### Option B: Check Email Health Endpoint

Start your backend:
```powershell
npm run dev
```

Then in your browser or API client, go to:
```
http://localhost:5000/api/auth/email-health
```

**Expected response:**
```json
{
  "configured": true,
  "mode": "smtp",
  "providers": {
    "smtp": true,
    "resend": false,
    "console": false
  },
  "degraded": false
}
```

---

## Step 5: Test OTP Email Flow

1. **Open frontend:** `http://localhost:5173`
2. **Go to Sign Up page**
3. **Enter test data:**
   - Email: Use a **real email address** you can check
   - Password: Any password (min 6 chars)
   - Phone: 10-digit number
   - College: Select one
   - Name: Any name
4. **Click "Send OTP"**

### Check for Success:

**Backend console should show:**
```
✅ OTP email sent successfully to test@gmail.com
```

**Your email inbox should receive:**
- Subject: `💖 Your SeeU-Daters Verification Code`
- Contains: 6-digit OTP code
- Valid for: 5 minutes

**Check important:** If email doesn't arrive:
- ✅ Check **Spam/Junk folder**
- ✅ Check **Promotions tab** (if Gmail)
- ✅ Wait 30-60 seconds before refreshing

---

## Troubleshooting 🔧

### Error: "Invalid login" or "535 Authentication Failed"

**Cause:** Wrong credentials

**Fix:**
1. Verify EMAIL_USER is your actual Gmail address
2. Verify EMAIL_PASSWORD is the 16-char app password (not your Google password)
3. Generate a NEW app password at: myaccount.google.com/apppasswords
4. Update .env and restart backend

**Test:**
```powershell
node test-gmail-smtp.js
```

---

### Error: "Connection timeout" or "ETIMEDOUT"

**Cause:** Network/firewall blocking port 587

**Fix option 1 - Try different SMTP port:**
```env
SMTP_PORT=465
SMTP_SECURE=true
```

**Fix option 2 - Check network connection:**
```powershell
Test-NetConnection -ComputerName smtp.gmail.com -Port 587
```

Expected result: `TcpTestSucceeded : True`

If False, check your firewall allows outbound SMTP.

---

### Error: "Connection refused" or "ECONNREFUSED"

**Cause:** Can't reach Gmail SMTP server

**Fix:**
1. Verify SMTP_HOST is correct in .env: `smtp.gmail.com`
2. Try with different port: `SMTP_PORT=465` with `SMTP_SECURE=true`
3. Check network connectivity

---

### Emails not arriving but no errors in logs

**Check these:**
1. ✅ Email address is spelled correctly in signup form
2. ✅ Check **Spam/Junk folder** - legitimate emails sometimes go there
3. ✅ Check **Promotions tab** (if using Gmail)
4. ✅ Wait 60 seconds - Gmail can be slow
5. ✅ Check backend logs for: `❌ OTP EMAIL FAILED` messages

---

### Backend shows "Email provider not configured for production"

**This means:** SMTP credentials are still not set correctly

**Check:**
```env
EMAIL_USER=     # Should NOT be empty
EMAIL_PASSWORD= # Should NOT be empty
```

**If still blank:**
1. Verify you saved .env file
2. Stop backend (`Ctrl+C`)
3. Restart backend: `npm run dev`
4. Check console logs for email service startup messages

---

## Email Service Startup Logs

When backend starts, you should see:

```
================================================================================
📧 [STARTUP] Email Service Initialize
================================================================================
   - Email User: yourname@gmail.com
   - Email Password: ✓ SET (16 chars)
   - SMTP Host: smtp.gmail.com
   - SMTP Port: 587
   - SMTP Secure: false
   - Production Mode: false
================================================================================
📧 [SMTP MODE] Using authenticated SMTP transport
✅ Gmail SMTP Connection Verified!
   OTP emails will be sent via Gmail SMTP
================================================================================
```

**If you see:**
- ❌ `Email User: ✗ NOT SET` → EMAIL_USER is not configured
- ❌ `Email Password: ✗ NOT SET` → EMAIL_PASSWORD is not configured
- ❌ `Gmail SMTP Connection Failed` → Credentials are wrong

---

## Production Deployment Checklist

When deploying to production (Render, Netlify, Vercel):

1. ✅ Set `NODE_ENV=production` in hosting platform
2. ✅ Add environment variables:
   - `EMAIL_USER=production-email@gmail.com`
   - `EMAIL_PASSWORD=your-app-password`
3. ✅ Generate a **NEW app password** for production Gmail account (don't reuse development credentials)
4. ✅ Test OTP signup flow on staging before going live
5. ✅ Monitor logs for email failures: `/api/auth/email-health`

**Optional: Add fallback provider**
- Sign up for free Resend account: resend.com
- Get API key and add to environment variables:
  ```env
  RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
  RESEND_FROM=SeeU-Daters <no-reply@yourdomain.com>
  ```

---

## Current Configuration Status

✅ **Setup Complete:**
- `.env` file created with template
- Gmail SMTP properly configured in code
- Nodemailer transporter ready
- Error handling implemented
- 3 retry attempts configured
- Fallback transporters configured

⚠️ **Pending:**
- Update `.env` with YOUR Gmail credentials
- Run test to verify connection
- Test OTP signup flow

---

## Quick Reference

**Files involved:**
- [utils/emailService.js](../../utils/emailService.js) - Email sending logic
- [routes/auth.js](../../routes/auth.js#L352) - OTP sending endpoint
- [.env](.env) - Configuration (NEEDS YOUR CREDENTIALS)

**Key endpoints:**
- `POST /api/auth/send-otp` - Request OTP
- `POST /api/auth/verify-otp` - Verify OTP code
- `GET /api/auth/email-health` - Check email service status

**Important:**
- Gmail app passwords ≠ your account password
- 2FA must be enabled first
- OTP expires in 5 minutes (configurable)
- Emails may take 10-30 seconds to arrive

---

## Still Having Issues?

Check these in order:

1. **Verify credentials:**
   ```powershell
   node test-gmail-smtp.js
   ```

2. **Check backend logs for errors:**
   ```
   npm run dev
   ```
   Look for: `❌ OTP EMAIL FAILED` or `❌ SMTP attempt failed`

3. **Test endpoint directly:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/send-otp \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@gmail.com",
       "name": "Test User",
       "phone": "9999999999",
       "password": "password123",
       "college": "IIT Delhi"
     }'
   ```

4. **Check email service health:**
   ```
   http://localhost:5000/api/auth/email-health
   ```

---

## Summary

| Step | Status | Next Action |
|------|--------|-------------|
| Enable 2FA | ⏳ Todo | Go to myaccount.google.com/security |
| Get App Password | ⏳ Todo | Go to myaccount.google.com/apppasswords |
| Update .env | ⏳ Todo | Set EMAIL_USER and EMAIL_PASSWORD |
| Run Test | ⏳ Todo | Execute: `node test-gmail-smtp.js` |
| Test OTP Signup | ⏳ Todo | Try signup at http://localhost:5173 |

Once all steps are complete ✅, OTP emails will be sent reliably!
