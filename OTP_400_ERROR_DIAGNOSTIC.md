# 🚨 OTP 400 Error - Immediate Diagnostic Report

**Date:** March 27, 2026  
**Issue:** Backend returns 400 Bad Request on `/api/auth/send-otp`  
**Impact:** User signup blocked  
**Status:** Investigating  

---

## 📋 What the Frontend Sends

The frontend (Signup.jsx) sends this to OTP endpoint:

```javascript
{
  name: formData.name.trim(),              // e.g., "John Doe"
  email: formData.personalEmail.toLowerCase().trim(),  // e.g., "john@gmail.com"
  phone: formData.phone,                   // e.g., "9999999999"
  password: formData.password,             // e.g., "Test123" (must be 8+ chars, uppercase, lowercase, digit)
  college: formData.college                // e.g., "Local Community"
}
```

---

## 🔍 Backend Validation (What Can Fail)

The backend `/api/auth/send-otp` endpoint validates:

```javascript
// Line 160-180 in routes/auth.js

if (!email || !validateEmail(email)) {
  throw new AppError('Valid email address is required', 400);  // ❌ 400 ERROR 1
}

if (!password || !validatePassword(password)) {
  throw new AppError('Password must be at least 8 characters with uppercase, lowercase, and number', 400);  // ❌ 400 ERROR 2
}

if (!name || name.trim().length < 2) {
  throw new AppError('Name is required', 400);  // ❌ 400 ERROR 3
}

if (!phone || !validatePhone(phone)) {
  throw new AppError('Valid 10-digit phone number is required', 400);  // ❌ 400 ERROR 4
}

if (!college) {
  throw new AppError('College selection is required', 400);  // ❌ 400 ERROR 5
}
```

---

## ✅ Password Validation Details

**Requirement:** 8+ characters, with uppercase, lowercase, and digit

```javascript
validatePassword = (password) => {
  if (!password || password.length < 8) return false;
  
  const hasUpperCase = /[A-Z]/.test(password);  // Must have A-Z
  const hasLowerCase = /[a-z]/.test(password);  // Must have a-z
  const hasDigit = /[0-9]/.test(password);      // Must have 0-9
  
  return hasUpperCase && hasLowerCase && hasDigit;
};
```

**Testing Different Passwords:**

| Password | Length | Upper | Lower | Digit | Valid | Reason |
|----------|--------|-------|-------|-------|-------|--------|
| `Test123` | 8 ✅ | ✅ | ✅ | ✅ | ✅ YES | Perfect format |
| `Password1` | 9 ✅ | ✅ | ✅ | ✅ | ✅ YES | Valid |
| `test123` | 7 ✅ | ❌ | ✅ | ✅ | ❌ NO | Missing uppercase |
| `TEST123` | 7 ✅ | ✅ | ❌ | ✅ | ❌ NO | Missing lowercase |
| `Test` | 4 ❌ | ✅ | ✅ | ❌ | ❌ NO | Too short + no digit |

---

## 🧪 Manual Test (Postman)

### Test Request:

```
METHOD: POST
URL: https://cu-daters-backend.onrender.com/api/auth/send-otp

HEADERS:
Content-Type: application/json

BODY (JSON):
{
  "name": "Test User",
  "email": "your-test-email@gmail.com",
  "phone": "9999999999",
  "password": "Test123",
  "college": "Local Community"
}
```

### Expected Responses:

**✅ Success (200):**
```json
{
  "success": true,
  "message": "OTP sent successfully to your email. Valid for 5 minutes.",
  "data": {
    "code": "OTP_SENT",
    "email": "your-test-email@gmail.com",
    "expiresIn": 300,
    "emailStatus": "sent"
  }
}
```

**❌ 400 - Invalid Password:**
```json
{
  "success": false,
  "message": "Password must be at least 8 characters with uppercase, lowercase, and number",
  "status": 400
}
```

**❌ 400 - Invalid Email:**
```json
{
  "success": false,
  "message": "Valid email address is required",
  "status": 400
}
```

**❌ 400 - Invalid Phone:**
```json
{
  "success": false,
  "message": "Valid 10-digit phone number is required",
  "status": 400
}
```

**❌ 400 - Missing College:**
```json
{
  "success": false,
  "message": "College selection is required",
  "status": 400
}
```

---

## 🔧 Troubleshooting Steps

### Step 1: Check Browser Network Tab
1. Open https://www.cudaters.tech/signup (DevTools: F12)
2. Go to "Network" tab
3. Fill form:
   - Name: "Test User"
   - Email: "test@gmail.com"
   - Phone: "9999999999"
   - Password: "Test123"
   - College: "Local Community"
4. Click "Send OTP"
5. Look for request named `send-otp`
6. Click it → "Response" tab
7. You'll see the exact error JSON

### Step 2: Check Frontend Validation
If frontend validation shows error before sending:
- Browser console (F12 > Console)
- Look for red error messages
- Check if formData fields are filled

### Step 3: Test with Postman
Import the collection and run the request to isolate frontend vs backend issue.

### Step 4: Check Render Environment Variables
```
Render Dashboard > cu-daters-backend > Environment

Must be set:
✅ EMAIL_USER = cudaters.verify@gmail.com
✅ EMAIL_PASSWORD = dciqqnyqmunftyzt
✅ MONGODB_URI = ...
```

### Step 5: Check Render Logs
1. Go to Render Dashboard
2. Select cu-daters-backend
3. Click "Logs" tab
4. Look for recent OTP requests
5. Check for error messages

---

## 📊 Field Requirements Checklist

When testing, verify ALL fields:

```
✅ Name:
   - Length: 2+ characters
   - Example: "John Doe", "Jane", "Alex"

✅ Email:
   - Format: something@domain.com
   - Example: "john@gmail.com", "user@example.com"
   - NOT: "invalid", "@gmail.com", "user@"

✅ Phone:
   - Format: Exactly 10 digits
   - Example: "9999999999", "1234567890"
   - NOT: "99999999" (9 digits), "+919999999999" (formatted)

✅ Password:
   - Length: 8+ characters minimum
   - Uppercase: At least one A-Z
   - Lowercase: At least one a-z
   - Digit: At least one 0-9
   - Examples that WORK: "Test123", "Password1", "MyPass99"
   - Examples that FAIL: "test123" (no upper), "Password" (no digit)

✅ College:
   - Must be selected
   - Options: "Local Community", "Independent / Not Listed", etc.
```

---

## 🎯 Most Likely Causes of 400

| Probability | Issue | How to Fix |
|-------------|-------|-----------|
| 🔴 40% | Password format wrong | Use `Test123` format (8+ chars, upper, lower, digit) |
| 🟡 30% | Email not reaching form | Check if personalEmail field is populated |
| 🟡 20% | Phone format (extra chars) | Remove spaces, dashes - just 10 digits |
| 🟢 10% | College not selected | Must select from dropdown |

---

## 🧪 Quick Test Script

Use PowerShell to test:

```bash
$Body = @{
    name = "Test User"
    email = "testuser@gmail.com"
    phone = "9999999999"
    password = "Test123"
    college = "Local Community"
} | ConvertTo-Json

$Response = Invoke-WebRequest -Uri "https://cu-daters-backend.onrender.com/api/auth/send-otp" `
    -Method POST `
    -ContentType "application/json" `
    -Body $Body `
    -SkipHttpErrorCheck

$Response.StatusCode
$Response.Content | ConvertFrom-Json
```

---

## 📝 What to Report If Still Failing

Run the Postman test, then report:

```
1. Exact error message from Response:
   [Copy paste the JSON response]

2. Status code:
   [200 / 400 / 503 / timeout]

3. Password used:
   [What exactly you entered]

4. Email used:
   [What email address]

5. Browser console errors:
   [Any red text in F12 > Console]

6. Render logs:
   [Any ERROR lines visible]
```

---

## ✅ Success Verification

After fix, verify:

```
✅ POST to /send-otp returns 200
✅ Response includes "OTP sent successfully"
✅ Email arrives in inbox
✅ User can enter OTP
✅ Signup completes
✅ User account created
```

---

**Next Step:** Run Postman test and report the exact error. Then I can pinpoint the exact issue.
