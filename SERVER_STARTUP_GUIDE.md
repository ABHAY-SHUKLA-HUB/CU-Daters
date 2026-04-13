# 🚀 SERVER STARTUP & MANAGEMENT GUIDE

## ⚠️ IMPORTANT: Backend Server Must Be Running

**The registration error you're seeing means the backend server is NOT running.**

---

## ✅ HOW TO START THE SERVER

### **Method 1: Simple Start (Recommended)**
```bash
cd /c/Users/krish/vm/CU-Daters
npm start
```

The server will start on **http://localhost:5000**

You should see:
```
✅ Environment Loading (LOCAL)
✅ Database: MongoDB Atlas (Cloud)
✅ EMAIL SERVICE initialized
✅ Razorpay initialized successfully
```

### **Method 2: Using Background Process**
```bash
cd /c/Users/krish/vm/CU-Daters
nohup npm start > server.log 2>&1 &
```

This keeps server running even if terminal closes.

---

## 🔍 VERIFY SERVER IS RUNNING

### Check if Backend is Up:
```bash
curl http://localhost:5000
```

Should return:
```json
{
  "message":"SeeU-Daters Backend API",
  "version":"1.0.0",
  "endpoints":{"auth":"/api/auth",...}
}
```

### Check Email Service:
```bash
curl http://localhost:5000/api/auth/email-health
```

Should return:
```json
{
  "success":true,
  "data":{"code":"EMAIL_SERVICE_OK"}
}
```

### Check Server Logs:
```bash
tail -f /c/Users/krish/vm/CU-Daters/server.log
```

---

## ⚙️ PORT 5000 ALREADY IN USE?

If you see: `❌ Port 5000 is already in use`

### Kill the Old Process:
```bash
# Windows CMD
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or in bash:
lsof -ti:5000 | xargs kill -9
```

Then start fresh:
```bash
npm start
```

---

## 🧪 TEST SIGNUP ENDPOINT

After server is running, test signup:

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test User",
    "email":"test@test.com",
    "phone":"9876543210",
    "password":"TestPass123",
    "college":"Independent / Not Listed",
    "gender":"male",
    "fieldOfWork":"Software Engineering",
    "experienceYears":"3",
    "bio":"Test bio for signup",
    "liveSelfie":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "idProofFile":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }'
```

Should return **201 Created** with user data.

---

## 🛑 STOP SERVER

### If Running in Foreground:
```bash
Press Ctrl + C
```

### If Running in Background:
```bash
# Find process
ps aux | grep "npm start"

# Kill it
kill <PID>
```

---

## 🔧 ENVIRONMENT SETUP

Make sure your `.env` file has:
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
RESEND_API_KEY=re_...
GMAIL_USER=cudaters.verify@gmail.com
GMAIL_PASSWORD=...
NODE_ENV=development
```

---

## 📊 MONITORING CHECKLIST

Before testing signup, verify:

- [ ] Server running on port 5000
- [ ] `curl http://localhost:5000` returns API response
- [ ] Email service health check passes
- [ ] MongoDB connection successful
- [ ] No error messages in console

---

## ⚡ QUICK START (Copy & Paste)

```bash
cd /c/Users/krish/vm/CU-Daters
npm start
```

Wait for:
```
✅ All services initialized
```

Then try signup on **http://localhost:5173**

---

## 🆘 COMMON ERRORS

### Error: "Registration failed. Please try again"
→ **Backend server not running**
→ Run: `npm start`

### Error: "Cannot connect to server"
→ **Server crashed**
→ Check logs: `cat server.log`

### Error: "Email service failed"
→ **Bad email configuration**
→ Check `.env` RESEND_API_KEY

### Error: "Database connection failed"
→ **No internet or MongoDB down**
→ Check MongoDB Atlas dashboard

---

## 📝 NOTES

- Server must be running BEFORE you open the app
- Don't close the terminal where server is running
- Frontend on localhost:5173, Backend on localhost:5000
- They communicate via API calls

---

## 🎯 CURRENT STATUS

✅ Server: Ready to start
✅ Database: Connected (tested)
✅ Email Service: Configured (tested)
✅ Frontend: Built and ready
✅ All code: Fixed and committed

**Just run `npm start` and test signup!**

