# 🚀 URGENT: OTP Debugging & Error Code Reference

## Status Code Reference

When testing the `/api/auth/send-otp` endpoint, here's what each status code means:

### ✅ 200 - SUCCESS
```json
{
  "success": true,
  "message": "OTP sent successfully to your email. Valid for 5 minutes.",
  "data": {
    "code": "OTP_SENT",
    "email": "user@example.com",
    "expiresIn": 300,
    "otpRequestsRemaining": 4,
    "maxRequests": 5,
    "emailStatus": "sent"
  }
}
```
**✅ What to do:** Check your email for OTP within 30 seconds

---

### ❌ 400 - Bad Request / Validation Error

#### Password Invalid
```json
{
  "success": false,
  "message": "Password must be at least 8 characters with uppercase, lowercase, and number"
}
```
**🔧 Fix:** Password format is strict:
- ✅ VALID: `Test123`, `Password1`, `MyPass#1`
- ❌ INVALID: `test123` (no uppercase), `Test12` (only 6 chars), `Test***` (no number)

#### Email Invalid
```json
{
  "success": false,
  "message": "Valid email address is required"
}
```
**🔧 Fix:** Use proper email format (name@domain.com)

#### Already Registered
```json
{
  "success": false,
  "message": "Email already registered. Please login instead."
}
```
**🔧 Fix:** Email is already in use. Try login or use different email.

#### Missing Fields
```json
{
  "success": false,
  "message": "[fieldname] is required"
}
```
**🔧 Fix:** Fill all required fields: name, email, password, phone, college

---

### ⏱️ 429 - Rate Limited
```json
{
  "success": false,
  "message": "You have reached your OTP limit. Please try again after 5 minutes.",
  "code": "OTP_RATE_LIMITED"
}
```
**🔧 Fix:**
- Max 5 OTP requests per 20 minutes
- Wait 20 minutes before trying again
- OR use different email address for testing

---

### 🚨 503 - Email Service Down

#### Provider Auth Failed (CRITICAL)
```json
{
  "success": false,
  "message": "OTP email service is not configured correctly right now. Please contact support.",
  "code": "OTP_EMAIL_PROVIDER_AUTH_FAILED",
  "retryAfterSeconds": 300,
  "emailStatus": "failed"
}
```
**🔧 This means email credentials are WRONG or EXPIRED:**
1. Check Render dashboard > Environment variables
2. Verify `EMAIL_USER` = `cudaters.verify@gmail.com`
3. Verify `EMAIL_PASSWORD` = `dciqqnyqmunftyzt` (Gmail app password)
4. If different, update and save (triggers auto-redeploy)
5. Wait 5 minutes before retry

#### Temporary Delivery Failure
```json
{
  "success": false,
  "message": "Unable to send OTP email right now. Please try again in 1-2 minutes.",
  "code": "OTP_EMAIL_DELIVERY_FAILED",
  "retryAfterSeconds": 90,
  "emailStatus": "failed"
}
```
**🔧 This is usually temporary:**
1. Wait 2 minutes
2. Try again
3. If persists, check Gmail account for blocks

---

## Quick Diagnostic Steps

### Step 1: Confirm Backend is Running
```bash
curl https://cu-daters-backend.onrender.com/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "email": {
    "configured": true,
    "mode": "smtp",
    "counters": {
      "totalAttempts": 10,
      "totalSuccesses": 9,
      "totalFailures": 1
    }
  }
}
```

### Step 2: Check Email Service Counter
Look for `email.counters` in `/api/health`:
- **totalAttempts:** How many times email was tried
- **totalSuccesses:** How many succeeded
- **totalFailures:** How many failed

If failures are high (>10%), check email credentials.

### Step 3: Manual Test with Correct Password
```bash
PASSWORD_VALID="Test123"  # Must be: 8+ chars, letter, number, uppercase
PASSWORD_INVALID="test123" # Too short + no uppercase

# Test with VALID password
curl -X POST https://cu-daters-backend.onrender.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test User\",
    \"email\": \"your-email@gmail.com\",
    \"phone\": \"9999999999\",
    \"password\": \"Test123\",
    \"college\": \"Local Community\"
  }"
```

---

## Common Issues & Fixes

| Issue | Symptom | Fix |
|-------|---------|-----|
| **Wrong Gmail Password** | Status 503 + "Provider Auth Failed" | Get new app password from Google account |
| **Password Too Short** | Status 400 + "at least 8 characters" | Use password like `Test123` |
| **Already Registered** | Status 400 + "already registered" | Use different email or call login endpoint |
| **Rate Limited** | Status 429 + "reached your OTP limit" | Wait 20 minutes or use different email |
| **Backend Not Deployed** | Timeout / Connection Refused | Deploy to Render or start local server |
| **Wrong API URL** | CORS error in browser | Verify URL is `https://cu-daters-backend.onrender.com` |
| **Email Service Down** | All emails return 503 | Contact hosting provider |

---

## Email Credentials Verification

### Current Setup
- Email Account: `cudaters.verify@gmail.com`
- Password Type: Gmail App Password (16 chars)
- SMTP Server: `smtp.gmail.com` port 587
- Environment Variables Set: YES ✅

### To Verify Credentials:
1. Go to https://myaccount.google.com/security
2. Look for "App passwords" section
3. Verify CU-Daters app password matches `dciqqnyqmunftyzt`
4. If different, generate new one
5. Update in Render dashboard

### If Gmail Password Expired:
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows"
3. Generate new password (16-character string)
4. Copy entire password
5. Update in Render > Environment > EMAIL_PASSWORD
6. Save (auto-redeploys)

---

## Using the Test Scripts

### PowerShell Test Script
```bash
# Run from project root:
powershell -ExecutionPolicy Bypass .\test-otp-endpoint.ps1

# Menu Options:
# 1 = Health Check - LOCAL
# 2 = Health Check - PRODUCTION  
# 3 = OTP Test - LOCAL
# 4 = OTP Test - PRODUCTION
# 5 = Run All Tests
```

### Postman Collection
1. Download: `CU-Daters-OTP-Tests.postman_collection.json`
2. Open Postman
3. Click "Import"
4. Select the file
5. Use requests to test LOCAL and PRODUCTION endpoints

---

## What to Report if Still Failing

After running the checklist and test scripts, report:

```
BACKEND STATUS:
[ ] Deployed ✅ / Not deployed ❌ / Failed ❌
[ ] Health endpoint responding: YES / NO

ENVIRONMENT VARIABLES:
[ ] EMAIL_USER set correctly: YES / NO
[ ] EMAIL_PASSWORD set correctly: YES / NO
[ ] Other vars complete: YES / NO

POSTMAN/CURL TEST:
[ ] Status code: ____ (expected: 200 or specific error)
[ ] Error message: ________________________________
[ ] Exact curl command used: ______________________

PASSWORD TESTED:
[ ] Format used: _________________ (should be: 8+ chars, letter, digit, uppercase)

BROWSER CONSOLE:
[ ] Error shown: ________________________________
[ ] Network tab shows request: YES / NO
[ ] Response body: _______________________________
```

---

## Render Logs Live View

While testing, keep Render logs open:
```
1. https://dashboard.render.com
2. Select cu-daters-backend
3. Click "Logs" tab
4. Scroll to bottom
5. Watch in real-time as you test
6. Look for:
   - ✅ "OTP email sent successfully"
   - ❌ "OTP EMAIL FAILED"
   - ❌ "Error sending OTP"
```

---

## Emergency: Force Rebuild

If something seems cached or wrong:

```
Render Dashboard:
1. Select cu-daters-backend
2. Click "Manual Deploy" button
3. Wait for "Deploy successful"
4. Clear browser cache (Ctrl+Shift+Delete)
5. Test again
```

---

## Success Path

1. ✅ Health check 200 OK
2. ✅ Email counters show successes
3. ✅ Password format valid
4. ✅ OTP test returns 200
5. ✅ Email arrives in inbox
6. ✅ User can sign up
7. ✅ OTP verified, account active

🎉 Done!
