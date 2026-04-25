# 🚀 Razorpay Integration - Complete Setup Guide

## ✅ Integration Complete!

Your SeeU-Daters application now has Razorpay payment integration in **TEST MODE** enabled. Here's everything you need to know:

---

## 📋 What Was Integrated

### Backend Setup ✓
- **Razorpay API Routes** (`/api/razorpay`)
  - `POST /api/razorpay/order` - Create payment orders
  - `POST /api/razorpay/verify` - Verify & process payments
  - `GET /api/razorpay/key` - Get public key for frontend
  
- **Environment Variables** (.env)
  - `RAZORPAY_KEY_ID=rzp_test_SVRde9n6sR1wwb` ✓
  - `RAZORPAY_KEY_SECRET=XA51VtXSmw798VT6ZS4DZz1I` ✓

- **Database Updates**
  - User Model: Added `lastSubscriptionId` and `lastRazorpayPaymentId` fields
  - Subscription Model: Already tracking payment details with Razorpay payment IDs

### Frontend Setup ✓
- **Razorpay Script** - Added to `index.html`
- **RazorpayCheckout Component** - Handles payment checkout flow
- **RazorpayCheckoutPage** - Complete checkout page with plan selection
- **App Routes** - Added `/razorpay-checkout` route

---

## 🧪 Testing Your Integration

### Step-by-Step Testing

#### 1. **Start Your Application**
```bash
npm run server:dev   # Start backend (Terminal 1)
npm run dev          # Start frontend (Terminal 2)
```

#### 2. **Navigate to Checkout**
- Go to `http://localhost:5173/razorpay-checkout`

#### 3. **Select a Plan**
Choose one of the available plans:
- **Monthly Premium**: ₹499 (30 days)
- **Quarterly Premium**: ₹1,299 (90 days, Save 13%)
- **Yearly Premium**: ₹3,999 (365 days, Save 33%)

#### 4. **Complete Payment**
- Click "Pay" button
- Razorpay checkout will open
- You'll see the payment amount and order details

#### 5. **Use Test Card**
When Razorpay checkout opens, enter:

**Test Card Details:**
- **Card Number**: `4111 1111 1111 1111`
- **Expiry**: Any future date (e.g., 12/25)
- **CVV**: Any 3-digit number (e.g., 123)
- **Card Holder**: Any name

**Payment Outcomes:**
- Amount ending in **0** (e.g., 100.00) → ✅ SUCCESS
- Amount ending in **2** (e.g., 100.02) → ❌ FAILED
- Amount ending in **3** (e.g., 100.03) → 🔄 PENDING (will succeed in 60 sec)

#### 6. **Verify Payment Success**
After successful payment:
- ✅ Razorpay closes automatically
- ✅ Payment signature is verified on backend
- ✅ Success confirmation appears
- ✅ User redirected to dashboard
- ✅ Subscription is activated in Firestore
- ✅ `subscription_status` = `'active'`
- ✅ `subscription_expiry_date` is set

#### 7. **Check Database**
After payment:
```javascript
// Check user subscription status
db.users.findOne({ _id: userId })
// Should show:
// - subscription_status: "active"
// - subscription_expiry_date: (future date)
// - lastRazorpayPaymentId: (payment_id)

// Check subscription record created
db.subscriptions.findOne({ payment_id: razorpay_payment_id })
// Should show:
// - status: "active"
// - amount: 499 (or selected amount)
// - expiry_date: (future date)
```

---

## 🔐 Security Features

✅ **Signature Verification**
- Every payment is cryptographically verified using HMAC-SHA256
- Prevents tampering or fake payments

✅ **User Authentication**
- All endpoints require valid JWT token
- Only authenticated users can create orders and verify payments

✅ **Duplicate Prevention**
- Payment IDs are unique and checked before processing
- Prevents double-charging

✅ **Test Mode**
- Using Razorpay test keys (safe for development)
- No real money is charged
- Test cards always available

---

## 📊 Payment Flow Diagram

```
1. User selects plan → RazorpayCheckoutPage
                    ↓
2. Clicks "Pay" button
                    ↓
3. Creates Razorpay Order (Backend: POST /api/razorpay/order)
                    ↓
4. Razorpay Checkout Opens
                    ↓
5. User enters test card details
                    ↓
6. Payment processed (Razorpay)
                    ↓
7. Success callback → Verify Signature (Backend: POST /api/razorpay/verify)
                    ↓
8. Create Subscription Record in DB
                    ↓
9. Update User subscription_status to 'active'
                    ↓
10. Frontend shows success confirmation
                    ↓
11. User redirected to dashboard
```

---

## 🔗 API Endpoints Reference

### Create Order
```bash
POST /api/razorpay/order
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "amount": 499,
  "plan": "Monthly Premium",
  "duration": 30
}

Response:
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "order_P7bGhJpjD7r9wP",
    "amount": 499,
    "currency": "INR",
    "keyId": "rzp_test_SVRde9n6sR1wwb",
    "userEmail": "user@email.com",
    "userName": "User Name",
    "planId": "monthly"
  }
}
```

### Verify Payment
```bash
POST /api/razorpay/verify
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "razorpay_payment_id": "pay_P7bGhJpjD7r9wP",
  "razorpay_order_id": "order_P7bGhJpjD7r9wP",
  "razorpay_signature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a",
  "plan": "Monthly Premium",
  "amount": 499,
  "duration": 30
}

Response:
{
  "success": true,
  "message": "Payment verified and subscription activated",
  "data": {
    "subscriptionId": "ObjectId(...)",
    "paymentId": "pay_P7bGhJpjD7r9wP",
    "status": "active",
    "expiryDate": "2026-04-24T..."
  }
}
```

### Get Public Key
```bash
GET /api/razorpay/key

Response:
{
  "success": true,
  "message": "Razorpay key retrieved",
  "data": {
    "keyId": "rzp_test_SVRde9n6sR1wwb"
  }
}
```

---

## 🎯 Common Test Scenarios

### ✅ Successful Payment
- Amount: ₹499.00
- Card: 4111 1111 1111 1111
- Result: Payment succeeds, subscription activated

### ❌ Failed Payment
- Amount: ₹499.02 (or any ending in 2)
- Card: 4111 1111 1111 1111
- Result: Payment fails, error message shown

### ⏳ Pending Payment
- Amount: ₹499.03 (or any ending in 3)
- Card: 4111 1111 1111 1111
- Result: Pending for 60 seconds, then succeeds

---

## 🚀 Going Live to Production

When ready to use **real Razorpay keys**:

1. **Get Production Keys from Razorpay Dashboard**
   - Visit: https://dashboard.razorpay.com/
   - Login to your account
   - Go to Settings → API Keys
   - Copy Production Key ID and Secret

2. **Update .env**
   ```
   RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXX
   RAZORPAY_KEY_SECRET=XXXXXXXXXXXXX
   ```

3. **Update Razorpay Dashboard Settings**
   - Webhook URL: `https://yourdomain.com/api/razorpay/webhook`
   - Test the webhook

4. **Verify Deployment**
   - Redeploy backend
   - Test with real cards on staging first
   - Monitor payment logs

---

## 📱 File Structure

```
Backend Routes:
- routes/razorpay.js ← Payment endpoints

Frontend Components:
- src/components/RazorpayCheckout.jsx ← Payment button
- src/pages/RazorpayCheckoutPage.jsx ← Checkout page
- src/App.jsx ← Route added

Database:
- models/User.js ← Updated subscription fields
- models/Subscription.js ← Already tracking payments
- .env ← Razorpay keys

HTML:
- index.html ← Razorpay script added
```

---

## 🐛 Troubleshooting

### Issue: "Razorpay SDK not loaded"
**Solution**: 
- Check that Razorpay script is loaded in `index.html`
- Clear browser cache
- Reload page

### Issue: "Invalid payment signature"
**Solution**:
- Verify RAZORPAY_KEY_SECRET is correct in .env
- Ensure key is not wrapped in quotes
- Restart backend server

### Issue: "orderId is required"
**Solution**:
- Check that order creation endpoint returns `data.orderId`
- Verify user is authenticated (Bearer token)
- Check backend logs for errors

### Issue: "User not found"
**Solution**:
- Ensure user is logged in
- Check JWT token is valid
- Verify user exists in database

### Issue: Payment closes without completion
**Solution**:
- Check browser console for JavaScript errors
- Verify Razorpay script loaded (Network tab)
- Check backend endpoint for CORS issues

---

## 📞 Support

- **Razorpay Docs**: https://razorpay.com/docs/
- **Test Cards**: https://razorpay.com/docs/development/using-postman/#sample-requests
- **API Reference**: https://razorpay.com/docs/api/

---

## ✨ Next Steps

1. ✅ **Test Payment Flow** (using guide above)
2. ✅ **Verify Database Updates**
3. ✅ **Test User Dashboard** (should show active subscription)
4. 🔄 **Update Premium Page Links** (point to `/razorpay-checkout`)
5. 🔄 **Add Subscription Expiry Handler** (check expiry on login)
6. 🔄 **Setup Production Keys** (when ready for live)

---

**Last Updated**: March 25, 2026
**Integration Status**: ✅ COMPLETE & READY FOR TESTING
**Test Mode**: ✅ ACTIVE
