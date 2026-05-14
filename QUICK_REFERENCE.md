# Quick Reference: New Registration System

## 🆕 For Users: How to Register (No OTP!)

### Step-by-Step Registration:

#### **Step 1: Account Details (1-2 minutes)**
```
Fill in:
- Full Name
- College Email (must be @cumail.in or @culkomail.in)
- Personal Email (optional)
- 10-digit Phone Number
- Password (min 6 characters)
- Community/Organization Selection
```
✅ Click "Next: Profile Info" → Go to Step 2

#### **Step 2: Profile Information (2-3 minutes)**
```
Fill in:
- Gender
- Branch / Field of Work
- Experience / Year (1-40)
- Bio (minimum 20 characters)
```
✅ Click "Next: Upload Photos" → Go to Step 3

#### **Step 3: Upload Photos (3-5 minutes)**
```
Upload:
- Live Selfie (from camera)
- ID Proof (government ID, student ID, or employee ID)
- Select ID type
```
✅ Click "Complete Registration" → Submit

#### **What Happens Next:**
- Account created ✅
- Redirected to "Pending Approval" page
- Admin will review your documents
- You'll receive email when approved or rejected
- ⏳ Approval usually takes 24-48 hours

---

## 👨‍💼 For Admin: How to Approve/Reject Users

### Access Admin Portal:
1. Go to: `http://localhost:5173/admin-login`
2. Email: `admin@cudaters.com`
3. Password: `AdminPassword123!`
4. Enter Admin PIN if required

### Approve User Registration:

1. **Find Pending Registrations:**
   - Click "Registration Approvals" in menu
   - See list of pending users

2. **Review User:**
   - Click on user to view details
   - See:
     - Profile info (name, email, phone, etc.)
     - Live selfie
     - ID proof
     - User bio and other details

3. **Approve:**
   - Click ✅ "Approve" button
   - Add admin notes (optional)
   - User gets approval email
   - User status changes to "active"
   - User can now use platform

### Reject User Registration:

1. **Click ❌ "Reject" button**
2. **Enter rejection reason** (required)
   - E.g., "ID document unclear, please resubmit with better quality"
3. **Confirm rejection**
4. User gets rejection email with reason
5. User can try again or contact support

### Request Resubmission:

1. **Click 🔄 "Request Resubmission" button**
2. **Enter reason/instructions**
   - E.g., "Please upload clearer selfie with face visible"
3. **Send**
4. User gets email with request
5. User can re-upload documents

---

## 📊 Admin Dashboard Stats

See overview of:
- 📋 Total pending approvals
- ✅ Approved today
- ❌ Rejected today
- 🔄 Still processing

---

## 🔐 No More OTP!

### What Changed:
| Before | Now |
|--------|-----|
| Signup Step 1: Account Details | Signup Step 1: Account Details |
| Signup Step 2: **Verify OTP (5 min)** | **REMOVED** ❌ |
| Signup Step 3: Profile Info | Signup Step 2: Profile Info |
| Signup Step 4: Photos | Signup Step 3: Photos |

### Benefits:
- ⚡ **Faster:** Skip 5-minute OTP wait
- 📲 **No Email Issues:** No "OTP in spam" problems
- ✅ **Safer:** Admin verifies identity manually
- 🎯 **Clear:** Users know status is "pending approval"

---

## 📧 Important Emails

### Confirmation Email (After Signup)
- Sent immediately after registration
- Confirms account creation
- Mentions pending approval status

### Approval Email
- Subject: "✅ Your SeeU-Daters Registration Approved!"
- Contains: Activation details, how to login

### Rejection Email
- Subject: "❌ Your SeeU-Daters Registration - Requires Action"
- Contains: Rejection reason, reapply instructions

---

## ❓ Common Questions

### Q: Why no OTP?
A: Faster registration + Admin can verify identity more securely by reviewing actual ID documents

### Q: How long does approval take?
A: Usually 24-48 hours during business hours

### Q: What if I'm rejected?
A: Check rejection reason in email, fix it, and reapply

### Q: Can I register multiple accounts?
A: No, one account per email. Admin tracks accounts.

### Q: What happens if my ID is unclear?
A: Admin will request resubmission with clear instructions

### Q: How is my ID protected?
A: Encrypted storage, only authorized admins can view

---

## 🚨 Status Meanings

- **pending** 🟡 - Waiting for admin approval
- **active** 🟢 - Approved! Can use full platform
- **rejected** 🔴 - Not approved, reapply allowed
- **suspended** ⛔ - Temporarily blocked by admin

---

## 📞 Support

Having issues?
1. Check email (spam folder too)
2. Contact admin at: admin@cudaters.com
3. Check pending-approval page after signup
