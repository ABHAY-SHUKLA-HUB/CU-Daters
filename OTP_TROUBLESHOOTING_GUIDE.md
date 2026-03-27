# 🚨 OTP Issue - Diagnostic Guide

## Critical Issues Found:

### 1. ❌ BACKEND PASSWORD VALIDATION MISMATCH
- **Frontend requires:** 8+ chars, uppercase, lowercase, digit
- **Backend currently requires:** 6+ chars (weak validation)
- **Fix:** Update backend validation to match frontend

### 2. ⚠️ NODE_ENV = production
- Issue: Vite needs `NODE_ENV=development` to build dev features
- Action: Use `.env.production` for backend only OR set NODE_ENV differently for backend vs frontend

---

## Troubleshooting Checklist:

### Step 1: Check Render Logs
```bash
1. Go to: https://dashboard.render.com
2. Select service: cu-daters-backend
3. Click "Logs" tab
4. Look for errors when OTP is triggered
5. Share the error message
```

### Step 2: Verify Backend Deployment
```bash
# Check if latest code is deployed
- Did you push to GitHub?
- Did Render auto-deploy?
- Check deployment timestamp in Render dashboard
```

### Step 3: Test Email Credentials
```bash
# The SMTP credentials should be in Render environment variables:
- EMAIL_USER=cudaters.verify@gmail.com
- EMAIL_PASSWORD=dciqqnyqmunftyzt
```

### Step 4: Manual OTP Test (Postman/cURL)
```bash
curl -X POST https://cu-daters-backend.onrender.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "phone": "9999999999",
    "password": "Test123",
    "college": "Local Community"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

---

## Common 400 Errors & Fixes:

| Error | Cause | Fix |
|-------|-------|-----|
| "Valid email required" | Missing/invalid email | Check email format |
| "Phone required" | Missing phone or wrong format | Must be 10 digits, no spaces |
| "College required" | Missing college selection | Select from list |
| "Password must be..." | Weak password | Need 8+ chars with uppercase, lowercase, digit |
| "Name required" | Missing name | Min 2 characters |

---

## Immediate Actions Required:

1. **Fix backend password validation** (make it stronger)
2. **Fix NODE_ENV** (should be "development" for frontend, "production" for backend)
3. **Redeploy backend** to Render
4. **Rebuild frontend** and redeploy
5. **Test with cURL/Postman**

