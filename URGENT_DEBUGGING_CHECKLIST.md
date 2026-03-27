# 📋 OTP Debugging Checklist - Run This Now

## ✅ Step 1: Verify Backend is Redeployed (2 min)

### Check Render Dashboard:
```
1. Go to: https://dashboard.render.com
2. Select service: cu-daters-backend
3. Look at "Deploys" section
4. Check timestamp of last deployment
   - Should be recent (within last 30 min)
   - Status should be ✅ "Live"
5. If old or failed:
   - Click "Manual Deploy" button
   - Wait for deployment to complete
```

### Check Health Endpoint:
Open this in browser:
```
https://cu-daters-backend.onrender.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "uptime": "...",
  "database": "connected"
}
```

If 404 or timeout → Backend not deployed
If error → Backend has issues

---

## ✅ Step 2: Check Environment Variables on Render (2 min)

### Go to Environment Settings:
```
1. Dashboard > cu-daters-backend
2. Click "Environment" tab
3. Scroll through and VERIFY these are set:

- EMAIL_USER = cudaters.verify@gmail.com ✅
- EMAIL_PASSWORD = dciqqnyqmunftyzt ✅
- MONGODB_URI = mongodb+srv://... ✅
- NODE_ENV = production ✅
- VITE_API_URL = https://cu-daters-backend.onrender.com ✅
- JWT_SECRET = (should be set) ✅
```

### If Any Missing:
1. Click "Add Environment Variable"
2. Enter key and value
3. Click "Save"
4. Service will auto-redeploy

### If Any Wrong:
1. Click the pencil icon to edit
2. Correct the value
3. Click "Save"
4. Auto-redeployment happens

---

## ✅ Step 3: Check Render Logs (3-5 min)

### Access Real-Time Logs:
```
1. Dashboard > cu-daters-backend
2. Click "Logs" tab
3. Look for recent entries (bottom of page)
```

### Perform OTP Request:
While watching logs, do this in another tab:
1. Go to https://www.cudaters.tech/signup
2. Fill form with:
   - Name: Test
   - Email: your-email@gmail.com
   - Phone: 9999999999
   - Password: Test123
   - College: Local Community
3. Click "Send OTP"

### Watch for Errors in Logs:
Look for patterns like:
```
❌ Error sending OTP email
❌ Validation failed
❌ MongoDB connection error
❌ CORS blocked
❌ Invalid password
```

### Copy the Exact Error:
```
Select all error text (Ctrl+A in logs)
Copy it (Ctrl+C)
Share this in support channel
```

---

## ✅ Step 4: Manual Endpoint Test - Postman (5 min)

### Create POST Request:
```
URL: https://cu-daters-backend.onrender.com/api/auth/send-otp

Headers:
Content-Type: application/json

Body (raw JSON):
{
  "name": "Test User",
  "email": "your-email@gmail.com",
  "phone": "9999999999",
  "password": "Test123",
  "college": "Local Community"
}
```

### Send & Check Response:

**If Success (200):**
```json
{
  "success": true,
  "message": "OTP verification link sent to your email",
  "data": {
    "emailStatus": "success",
    "messageId": "..."
  }
}
```

**If 400 Error:**
```json
{
  "success": false,
  "message": "Password must be at least 8 characters with uppercase, lowercase, and number"
}
```
→ Password requirement not met

**If 429 Error:**
```json
{
  "success": false,
  "message": "Too many OTP requests. Please wait..."
}
```
→ Rate limited, try again in 20 min

**If 500 Error:**
```json
{
  "success": false,
  "message": "Server error"
}
```
→ Check Render logs for exact error

**If Timeout:**
→ Backend not responding or CORS issue

---

## ✅ Step 5: Check Browser Network Tab (2 min)

### In Browser DevTools:
1. Open https://www.cudaters.tech/signup
2. Press `F12` to open DevTools
3. Go to "Network" tab
4. Fill signup form
5. Click "Send OTP"
6. Look for request named `send-otp`
7. Click it to see details:

**Request Tab:**
- Method: POST ✅
- URL: /api/auth/send-otp ✅
- Headers: Content-Type: application/json ✅
- Body: All fields filled ✅

**Response Tab:**
- Status: 200 (success) or 400/500 (error)
- Response body: Error message

---

## ✅ Step 6: Email Service Health Check (2 min)

### Test Email Service:
Open browser:
```
https://cu-daters-backend.onrender.com/api/health
```

Look for email service status:
```json
{
  "email": {
    "configured": true,
    "mode": "smtp",
    "smtp": {
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false
    },
    "counters": {
      "totalAttempts": 5,
      "totalSuccesses": 4,
      "totalFailures": 1
    }
  }
}
```

If failures count is high → Email service degraded

---

## Quick Diagnostic Summary

Fill this out and report back:

```
[ ] Backend Status: ✅ Deployed / ❌ Not deployed / ❌ Failed
[ ] Health Endpoint: ✅ 200 OK / ❌ Error
[ ] Environment Variables: ✅ All set / ❌ Missing: ___________
[ ] Render Logs Error: ___________________________________________
[ ] Postman Test: ✅ 200 Success / ❌ 400 / ❌ 500 / ❌ Timeout
[ ] Browser Console Error: ___________________________________________
[ ] Email Service: ✅ Working / ❌ Failures detected
```

---

## If Still Not Working - Share This:

1. **Screenshot of Render logs** (exact error)
2. **Postman response** (status code + body)
3. **Browser console error** (F12 > Console > red text)
4. **Request you sent** (what name/email/password/phone)
5. **Expected vs actual** response

---

## Next: Run These Tests Now

**Estimated time: 10 minutes**

```
1. Check backend deployed (2 min)
2. Check env vars on Render (2 min)
3. Watch Render logs while testing (3 min)
4. Manual Postman test (3 min)
```

**Report back with findings!** 🚀
