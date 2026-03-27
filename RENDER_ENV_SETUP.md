# ✅ Render Environment Variables Checklist

## Critical: Email Service Variables

These MUST be set in your Render dashboard for OTP to work:

```
EMAIL_USER = cudaters.verify@gmail.com
EMAIL_PASSWORD = dciqqnyqmunftyzt
EMAIL_FROM = cudaters.verify@gmail.com
```

**How to verify in Render:**
1. Go to https://dashboard.render.com
2. Select service: `cu-daters-backend`
3. Click "Environment" tab
4. Check that these variables are set

---

## How to Update Environment Variables in Render

### Option 1: Via Dashboard
1. Click "Environment" in service settings
2. Find the variable (e.g., `EMAIL_PASSWORD`)
3. Click the edit icon (pencil)
4. Update the value
5. Click "Save"
6. Service **auto-redeploys** with new variables

### Option 2: Via render.yaml (if using Git sync)
```yaml
envVars:
  - key: EMAIL_USER
    sync: false  # Manual sync - you control when to update
  - key: EMAIL_PASSWORD
    sync: false
  - key: EMAIL_FROM
    sync: false
```

---

## What Each Email Variable Does

| Variable | Purpose | Required |
|----------|---------|----------|
| `EMAIL_USER` | Gmail account email | ✅ YES |
| `EMAIL_PASSWORD` | Gmail app password (16 chars) | ✅ YES |
| `EMAIL_FROM` | Display "from" address | ✅ YES |
| `SMTP_HOST` | smtp.gmail.com | ✅ YES |
| `SMTP_PORT` | 587 | ✅ YES |

---

## Troubleshooting Email Issues

### 1. Email gets rejected (535 error)
**Cause:** Gmail credentials wrong
```
Fix:
1. Go to myaccount.google.com/apppasswords
2. Generate NEW 16-character app password
3. Update EMAIL_PASSWORD in Render (no spaces!)
4. Redeploy
```

### 2. Connection timeout
**Cause:** Gmail SMTP blocked
```
Fix:
1. Try SMTP_PORT=465 with SMTP_SECURE=true
2. Check firewall allows outbound 587/465
3. Use alternative email provider (Resend)
```

### 3. "Email service not configured"
**Cause:** Variables not set
```
Fix:
1. Verify all variables are in Render dashboard
2. Env variables must be set BEFORE deployment
3. Redeploy service after setting variables
```

---

## After Updating Variables

```
✅ Do this:
1. Update variable in Render dashboard
2. Wait for auto-redeployment (2-3 min)
3. Check logs: https://dashboard.render.com > Logs
4. Test OTP again

❌ Don't forget:
- Don't restart service manually (causes downtime)
- Variables take effect after redeployment
- Restart might lose state - let Render auto-deploy
```

---

## Quick Test

Once variables are set in Render, test with:

```bash
curl -X POST https://cu-daters-backend.onrender.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-test@gmail.com",
    "name": "Test User",
    "phone": "9999999999",
    "password": "Test123",
    "college": "Local Community"
  }'
```

Expected: `"success": true` with message ID

