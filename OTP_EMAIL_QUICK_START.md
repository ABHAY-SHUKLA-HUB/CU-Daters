# ⚡ OTP Email Setup - Quick Start (5 Minutes)

## ✅ Setup Checklist

### 1️⃣ Enable 2-Factor Authentication (2 minutes)
- [ ] Go to: **myaccount.google.com/security**
- [ ] Click **"2-Step Verification"**
- [ ] Follow setup steps (phone verification)
- [ ] Confirm: Shows checkmark ✓

### 2️⃣ Generate Gmail App Password (1 minute)
- [ ] Go to: **myaccount.google.com/apppasswords**
- [ ] Select: **Mail** + **Windows Computer**
- [ ] Click: **Generate**
- [ ] Copy: 16-character password (NO SPACES)
- [ ] Example: `abcdefghijklmnop`

### 3️⃣ Update .env File (1 minute)
- [ ] Open: `CU-Daters/.env`
- [ ] Find line: `EMAIL_USER=replace_with_your_gmail@gmail.com`
- [ ] Replace with: `EMAIL_USER=your-actual-email@gmail.com`
- [ ] Find line: `EMAIL_PASSWORD=replace_with_16char_app_password`
- [ ] Replace with: `EMAIL_PASSWORD=abcdefghijklmnop` (16 chars, no spaces)
- [ ] SAVE file

### 4️⃣ Verify Connection (1 minute)
- [ ] Open terminal in `CU-Daters` folder
- [ ] Run: `node test-gmail-smtp.js`
- [ ] Expected result: `✅ SMTP Connection Successful!`
- [ ] If error: See Troubleshooting below

### 5️⃣ Test OTP Email (Optional but Recommended)
- [ ] Start backend: `npm run dev`
- [ ] Go to: http://localhost:5173
- [ ] Click: Sign Up
- [ ] Enter email: (use a test email you can check)
- [ ] Fill form: password, phone, name, college
- [ ] Click: Send OTP
- [ ] Check: Backend console shows ✅ OTP email sent successfully
- [ ] Check: Email received in 30 seconds (check spam folder too!)

---

## 🎯 Expected Output

### Terminal (after running test script):
```
✅ EMAIL_USER configured: your-email@gmail.com
✅ EMAIL_PASSWORD set: 16 characters
✅ SMTP_HOST: smtp.gmail.com
✅ SMTP Connection Successful!
✅ Gmail SMTP Connection Verified!
   OTP emails will be sent via Gmail SMTP
```

### Backend logs (during OTP signup):
```
✅ OTP email sent successfully to test@example.com
```

### Email message:
- **From:** your-email@gmail.com
- **Subject:** 💖 Your SeeU-Daters Verification Code
- **Body:** Contains 6-digit OTP, valid 5 minutes

---

## ⚠️ Quick Troubleshooting

### "Invalid login" or "535 Authentication Failed"
**→ Wrong credentials**
```
1. Double-check EMAIL_PASSWORD (no extra spaces)
2. Generate NEW app password at myaccount.google.com/apppasswords
3. Update .env and restart: npm run dev
4. Test again: node test-gmail-smtp.js
```

### "Connection timeout" or "ETIMEDOUT"
**→ Port blocked**
```
Try different port in .env:
SMTP_PORT=465
SMTP_SECURE=true

Then test: node test-gmail-smtp.js
```

### "Connection refused"
**→ Can't reach Gmail servers**
```
1. Check network: Test-NetConnection -ComputerName smtp.gmail.com -Port 587
2. Should show: TcpTestSucceeded : True
3. If False: Check firewall/network
```

### Email sent but not received
**→ Check these:**
1. Verify email address is spelled correctly
2. Check **Spam/Junk folder**
3. Check **Promotions tab** (Gmail)
4. Wait 60 seconds - emails can be slow
5. Look for backend error logs: `❌ OTP EMAIL FAILED`

### Backend says "Email provider not configured"
**→ .env not saved properly**
```
1. Open CU-Daters/.env and verify EMAIL_USER and EMAIL_PASSWORD are set
2. Stop backend: Ctrl+C
3. Restart: npm run dev
4. Check console for: "📧 [SMTP MODE] Using authenticated SMTP transport"
```

---

## 📋 File Locations

- **Configuration:** `CU-Daters/.env` (edit this with YOUR credentials)
- **Full Guide:** `CU-Daters/OTP_EMAIL_FIX_GUIDE.md` (detailed troubleshooting)
- **Test Script:** `CU-Daters/test-gmail-smtp.js` (run to verify)
- **Email Logic:** `CU-Daters/utils/emailService.js` (implementation)
- **Auth Routes:** `CU-Daters/routes/auth.js` (send-otp endpoint)

---

## 🚀 Next Steps

1. Complete all 5 checkboxes above ✓
2. Verify connection with: `node test-gmail-smtp.js`
3. Test signup flow: http://localhost:5173 → Sign Up
4. Check email arrives in inbox
5. **Done!** OTP emails now working ✅

---

## 📞 Support Commands

**Check email service status:**
```bash
curl http://localhost:5000/api/auth/email-health | jq
```

**Test OTP sending directly:**
```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gmail.com",
    "name": "Test",
    "phone": "9999999999",
    "password": "pass123",
    "college": "IIT"
  }'
```

**View backend logs:**
```bash
npm run dev
# Look for: ✅ OTP email sent successfully OR ❌ OTP EMAIL FAILED
```

---

## ✨ Success Indicators

- ✅ Backend starts without email configuration warnings
- ✅ SMTP Connection Test passes
- ✅ `GET /email-health` returns: `"configured": true, "mode": "smtp"`
- ✅ OTP signup sends email within 30 seconds
- ✅ Email received in inbox (not spam)
- ✅ OTP code visible in email body
- ✅ OTP code can be verified on frontend

Once all indicators are ✅, you're done!
