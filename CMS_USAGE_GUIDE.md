# Content Management System (CMS) - Admin Guide

## Overview

The **Content Management System (CMS)** allows you to update website content without touching code. All changes are stored in Firestore and appear instantly across the site.

---

## Accessing the CMS

1. **Login to Admin Portal**
   - Go to `http://localhost:5174/admin-login`
   - Enter your admin credentials (e.g., `admin@cudaters.tech` / `admin123`)

2. **Navigate to Content Management**
   - Once logged in, click **📝 Content Management** in the left sidebar
   - You'll see three main tabs: **Pages**, **Ambassador Positions**, and **Announcements**

---

## 1. Pages Editor

### What You Can Do
Edit content for all main pages on the site (Home, Features, Pricing, About, Careers, Contact, Privacy, Terms).

### How to Use

1. **Select a Page**
   - Click on a page in the left sidebar (e.g., "Home Page")

2. **Edit Fields**
   - Each field in the form corresponds to content on that page
   - Text fields: Single-line text inputs
   - Textarea fields: Multi-line content (50+ chars)
   - JSON fields: Complex data structures (arrays/objects)

3. **Save Changes**
   - Click **💾 Save Changes**
   - Changes update in Firestore immediately
   - Frontend pages fetch content from Firestore in real-time

### Example Fields by Page

- **Home**: title, subtitle, hero, stats[]
- **Careers**: title, description
- **About**: title, description, team[]
- **Contact**: email, phone, description
- **Privacy/Terms**: title, content

---

## 2. Ambassador Positions Manager

### What You Can Do
Create, edit, and manage campus ambassador positions that appear on the Careers page.

### How to Use

#### Create a New Position

1. Click **+ Add Position**
2. Fill in the form:
   - **Position Title**: e.g., "Campus Ambassador – CU Mohali"
   - **Description**: Detailed description of the role
   - **Target Reach**: e.g., "200-300 students"
   - **Time Commitment**: e.g., "3-5 hours/week"
   - **Rewards**: Add multiple rewards by typing and clicking **+** (e.g., "Free premium access", "Branded merch")
3. Click **💾 Save Position**

#### Edit a Position

1. Find the position card
2. Click the **✏️ Edit** button
3. Modify the fields
4. Click **💾 Save Position**

#### Delete a Position

1. Find the position card
2. Click the **🗑️ Delete** button
3. Confirm the deletion

### Live Updates

- Positions appear on the **Careers page** immediately after saving
- The Careers page fetches positions dynamically from Firestore
- If no positions exist in CMS, the page shows default fallback positions

---

## 3. Announcements / Banner

### What You Can Do
Create a site-wide announcement banner that appears at the top of every page until dismissed.

### How to Use

#### Create an Announcement

1. Click **Create** (or **✏️ Edit** if one exists)
2. Fill in the form:
   - **Announcement Text** *: The message to display (required)
   - **Link**: Optional URL (e.g., launch page, blog post)
   - **Expires On**: Date when banner should disappear
   - **Enable Announcement**: Toggle to enable/disable
3. Click **💾 Save Announcement**

#### Example Announcements

- "🎉 Launching April 2! Get early access → [learn more]"
- "🚨 Maintenance scheduled for May 15, 2-4 PM"
- "📢 Join our webinar series on dating in 2026!"

#### Features

- **Dismissable**: Users can close the banner (dismissed for their session)
- **Auto-expire**: Banner disappears on specified date
- **Enable/Disable**: Turn off without deleting
- **Optional Link**: Drive users to a landing page or CTA

#### Delete an Announcement

1. Click **🗑️ Delete Announcement**
2. Confirm deletion

---

## 4. Flexible Sections

**Coming soon!** In future updates, you'll be able to edit flexible content sections like:
- Careers page: "What We're Looking For" sections
- Home page: Hero text, stats, testimonials
- Custom CTAs and promotional content

---

## API Endpoints Reference

All CMS endpoints require authentication (JWT token). Only admins can write; everyone can read.

### Pages
- `GET /api/cms/pages` - Get all pages
- `GET /api/cms/pages/:pageName` - Get single page
- `PUT /api/cms/pages/:pageName` - Update page (admin only)

### Ambassador Positions
- `GET /api/cms/ambassador-positions` - Get all positions (public)
- `POST /api/cms/ambassador-positions` - Create position (admin only)
- `PUT /api/cms/ambassador-positions/:id` - Update position (admin only)
- `DELETE /api/cms/ambassador-positions/:id` - Delete position (admin only)

### Announcements
- `GET /api/cms/announcement` - Get current announcement (public)
- `POST /api/cms/announcement` - Create/update announcement (admin only)
- `DELETE /api/cms/announcement` - Delete announcement (admin only)

---

## Firestore Structure

All content is stored in Firestore under the `site_content` collection:

```
site_content/
├── pages/
│   ├── home: { title, subtitle, hero, stats, ... }
│   ├── features: { title, description, sections, ... }
│   └── ...
├── ambassadorPositions/
│   ├── positions: [
│   │   { id, title, description, targetReach, timeCommitment, rewards, ... }
│   └── ]
└── announcement/
    ├── text, link, expiresAt, enabled, createdAt, createdBy
```

---

## Security

✅ **Only admins can write** - Regular users cannot modify content
✅ **Public read access** - Frontend fetches content publicly (no auth required)
✅ **JWT authentication** - All admin requests verified with JWT token
✅ **Audit trail** - All changes tracked with admin ID and timestamp

---

## Troubleshooting

### Issue: Changes not appearing on frontend

**Solution:**
1. Check admin panel shows "✓ [Item] updated successfully"
2. Refresh the page in browser (frontend caches content)
3. Check browser DevTools console for errors
4. Verify Firestore credentials are configured in backend

### Issue: Cannot access Content Management section

**Solution:**
1. Confirm you're logged in as admin (check sidebar for "📝 Content Management")
2. If missing, your account may not have admin role
3. Create/verify admin account: `npm run create-admin -- your@email.com password "Your Name"`

### Issue: List is empty / items not loading

**Solution:**
1. If first time using CMS, you'll need to create items first
2. Check network tab in DevTools for API errors
3. Verify Firebase credentials are set in environment variables
4. Check server logs for Firestore connection errors

### Issue: Can't edit JSON fields

**Solution:**
1. JSON must be valid (proper quotes, commas, brackets)
2. Use a JSON validator if stuck: https://jsonlint.com
3. Or edit as single comma-separated values and convert to JSON later

---

## Best Practices

### Content Creation

✅ **Keep it concise** - Long text wraps poorly on mobile
✅ **Use clear language** - Write for your audience
✅ **Include CTAs** - Links in announcements drive engagement
✅ **Test on mobile** - Preview changes on small screens

### Position Management

✅ **Specific titles** - e.g., "Campus Ambassador – CU Mohali" (not "Ambassador")
✅ **Realistic details** - Be honest about time/reach/rewards
✅ **Update rewards** - Keep incentives attractive to recruit top talent
✅ **Deactivate old positions** - Delete or archive when no longer recruiting

### Announcements

✅ **Set expiration dates** - Keep banners from lingering indefinitely
✅ **Use emojis** - Makes announcements stand out
✅ **Keep text short** - ~10-15 words max
✅ **Link to action** - Direct users somewhere relevant

---

## Quick Reference

| Task | Steps |
|------|-------|
| **Edit home page** | Click "Home Page" in Pages tab → Edit fields → Save |
| **Add position** | Click "Ambassador Positions" → Click "+ Add" → Fill form → Save |
| **Update announcement** | Click "Announcements" → Click "Edit" → Change text/date → Save |
| **Change position details** | Find card → Click "✏️ Edit" → Update fields → Save |
| **Remove position** | Find card → Click "🗑️ Delete" → Confirm |
| **Delete announcement** | Click "🗑️ Delete Announcement" → Confirm |

---

## Support

If you encounter issues or have questions:

1. Check this guide's "Troubleshooting" section
2. Review browser console (DevTools) for errors
3. Check server logs for backend errors
4. Ask dev team for Firebase/Firestore issues

**Remember:** All changes are real-time. Test carefully in a staging environment first if possible!

---

**Last Updated:** March 2026
**Status:** ✅ Fully Functional
