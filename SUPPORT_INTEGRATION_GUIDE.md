# Live Chat Support System - Integration Guide

## Overview

This guide explains how to integrate the live chat support system into the SeeU Daters website. The system allows users to request support through a floating widget, and admins can manage support requests through a dedicated dashboard.

---

## Architecture

### Tech Stack
- **Frontend**: React with Socket.IO for real-time chat
- **Backend**: Express.js with MongoDB
- **Real-time**: Socket.IO (namespace: `/support`)
- **Authentication**: JWT + Firebase

### Key Components

#### User-Facing
1. **SupportWidget** - Floating button + modal for creating support requests
   - Category selection
   - Message input
   - Real-time chat interface
   - Status display (pending/accepted/rejected)

#### Admin-Facing
1. **AdminSupportDashboard** - List of all support requests with filters
   - View pending, accepted, rejected, closed requests
   - Accept/reject with reasons
   - Auto-reject timer display
   - Quick access to chat

2. **AdminSupportChat** - Real-time chat modal for responding to requests
   - Full message history
   - Send/receive messages in real-time
   - Close request functionality

---

## Integration Steps

### 1. Add SupportWidget to Main App

In your main `App.jsx` or layout component, import and add the support widget:

```jsx
import SupportWidget from './components/support/SupportWidget';

function App() {
  return (
    <div className="app">
      {/* Your existing app content */}
      <SupportWidget />
    </div>
  );
}
```

The widget will appear as a floating button in the bottom-right corner.

### 2. Add Admin Support Dashboard

In your admin panel routes, add the support dashboard:

```jsx
import AdminSupportDashboard from './components/admin/AdminSupportDashboard';

// In your admin routes
<Route path="/admin/support" element={<AdminSupportDashboard />} />
```

Then add a link in your admin navigation:

```jsx
<NavLink to="/admin/support">Support Requests</NavLink>
```

### 3. Initialize Support Categories

On server startup (in `server.js`), initialize default support categories:

```javascript
import { initializeSupportCategories } from './utils/initSupportCategories.js';

// After database connection
await initializeSupportCategories();
```

Or run manually:

```bash
node scripts/initSupportCategories.js
```

---

## API Endpoints

### User Endpoints

#### Create Support Request
```
POST /api/support/request
Headers: Authorization: Bearer {token}
Body: {
  category: "Account Issues",
  message: "I can't login to my account"
}
Response: {
  request_id: "...",
  status: "pending",
  category: "Account Issues"
}
```

#### Get Support Categories
```
GET /api/support/categories
Response: {
  categories: [
    { _id: "...", name: "Account Issues", icon: "👤" },
    ...
  ]
}
```

#### Get My Support Requests
```
GET /api/support/my-requests
Headers: Authorization: Bearer {token}
Response: {
  requests: [
    {
      _id: "...",
      status: "pending",
      messages: [...]
    }
  ]
}
```

#### Get Single Request with Messages
```
GET /api/support/request/{requestId}
Headers: Authorization: Bearer {token}
```

#### Send Message
```
POST /api/support/request/{requestId}/message
Headers: Authorization: Bearer {token}
Body: {
  message: "This is my message"
}
```

### Admin Endpoints

#### Get Support Requests
```
GET /api/admin/support/requests?status=pending&page=1
Headers: Authorization: Bearer {token}
```

#### Accept Request
```
POST /api/admin/support/request/{requestId}/accept
Headers: Authorization: Bearer {token}
```

#### Reject Request
```
POST /api/admin/support/request/{requestId}/reject
Headers: Authorization: Bearer {token}
Body: {
  reason: "Currently unavailable"
}
```

#### Send Admin Message
```
POST /api/admin/support/request/{requestId}/message
Headers: Authorization: Bearer {token}
Body: {
  message: "How can I help?"
}
```

#### Close Request
```
POST /api/admin/support/request/{requestId}/close
Headers: Authorization: Bearer {token}
Body: {
  notes: "Issue resolved"
}
```

#### Get Support Categories
```
GET /api/admin/support/categories
Headers: Authorization: Bearer {token}
```

#### Create Category
```
POST /api/admin/support/categories
Headers: Authorization: Bearer {token}
Body: {
  name: "New Category",
  description: "...",
  icon: "🆕"
}
```

---

## WebSocket Events

The system uses Socket.IO at `/support` namespace for real-time communication.

### Client Events

#### Join Support Request
```javascript
socket.emit('join_support_request', {
  requestId: "..."
});
```

#### Send Message
```javascript
socket.emit('send_support_message', {
  requestId: "...",
  message: "Hello"
});
```

#### Typing Indicator
```javascript
socket.emit('support_typing_start', { requestId: "..." });
socket.emit('support_typing_stop', { requestId: "..." });
```

#### Mark Messages Read
```javascript
socket.emit('mark_support_messages_read', { requestId: "..." });
```

#### Leave Room
```javascript
socket.emit('leave_support_request', { requestId: "..." });
```

### Server Events

#### Support Message
```javascript
socket.on('support_message', (data) => {
  console.log(data);
  // {
  //   _id: "...",
  //   requestId: "...",
  //   sender_id: "...",
  //   sender_name: "John",
  //   sender_type: "user|admin",
  //   message: "...",
  //   created_at: "2024-..."
  // }
});
```

#### Typing Indicator
```javascript
socket.on('support_typing_indicator', (data) => {
  // { requestId, userId, userName, isAdmin }
});
```

#### User Joined
```javascript
socket.on('user_joined_support', (data) => {
  // { requestId, userId, isAdmin, userName }
});
```

#### Admin Online Status
```javascript
socket.on('admin_online', (data) => {
  // { adminId, online: true/false }
});
```

---

## Features

### For Users
- ✅ Browse support categories
- ✅ Submit support request with message
- ✅ Real-time chat with support agents
- ✅ View request history
- ✅ Auto-reject notification (5 minutes)
- ✅ Typing indicators

### For Admins
- ✅ View all support requests with filtering
- ✅ Accept/reject requests
- ✅ Real-time chat with users
- ✅ Close requests with notes
- ✅ Auto-reject timer display
- ✅ Message counter per request
- ✅ Category management
- ✅ Activity logging

### System Features
- ✅ Auto-reject pending requests after 5 minutes
- ✅ 5-minute timeout with countdown
- ✅ Message persistence
- ✅ Real-time notifications
- ✅ Admin activity audit logs
- ✅ Rate limiting on request creation

---

## Configuration

### Auto-Reject Timeout
The auto-reject interval is configured to check every 60 seconds for requests older than 5 minutes. To modify:

Edit `utils/supportAutoReject.js`:
```javascript
const SUPPORT_REQUEST_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const INTERVAL = 60 * 1000; // Check every 1 minute
```

### Rate Limiting
Request creation is rate-limited to 5 requests per 15 minutes per user. Modify in `routes/support.js`:
```javascript
const supportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests
  message: 'Too many support requests...'
});
```

### Message Length Limits
- User message: 1000 characters max
- Chat message: 2000 characters max

---

## Default Support Categories

The system initializes with these categories:

1. 👤 Account Issues
2. ✓ Verification
3. 💳 Billing & Payments
4. 🔧 Technical Support
5. 🚩 Report a User
6. 🛡️ Safety & Moderation
7. 💡 Feature Request
8. ❓ Other

You can add more through the admin API or modify `utils/initSupportCategories.js`.

---

## Testing

### Test User Flow
1. Open the app
2. Click the floating "?" button in the bottom-right
3. Select a category
4. Enter a message
5. Click "Start Chat"
6. Wait for admin to accept (or auto-reject after 5 minutes)

### Test Admin Flow
1. Go to `/admin/support`
2. View pending requests
3. Click "Accept" on a request
4. Click "View Chat" to open the conversation
5. Send messages to the user
6. Click "Close Request" when done

### Test Auto-Reject
1. Create a support request
2. Wait 5 minutes without admin accepting
3. Request automatically moves to "rejected" status
4. User sees "No agent available" message

---

## Troubleshooting

### Support Widget Not Appearing
- Check that `SupportWidget` is imported and rendered in your App
- Verify CSS is loaded (`SupportWidget.css`)
- Check browser console for errors

### Chat Not Real-Time
- Verify Socket.IO is connected: `window.io` should exist
- Check that token is stored in localStorage
- Look for socket connection errors in console

### Admin Dashboard Not Loading
- Verify admin authentication is working
- Check that routes are registered
- Verify database connection

### Auto-Reject Not Working
- Check that `startSupportAutoRejectInterval()` is called in server.js
- Verify MongoDB queries are working
- Check server logs for errors

---

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Rate Limiting**: Support request creation is rate-limited
3. **Authorization**: Users can only view their own requests
4. **Admin-Only**: Certain actions (accept/reject/close) require admin role
5. **Audit Logging**: All admin actions are logged
6. **Socket Authentication**: WebSocket connections verify token

---

## Future Enhancements

Potential features to add:
- File/image upload support
- Pre-canned responses for admins
- Support request priority levels
- SLA tracking
- Chat satisfaction ratings
- Email notifications
- Auto-reply messages
- Chatbot integration

---

## Support

For issues or questions, refer to the backend logs or reach out to the development team.
